import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { PropertySubmission, SubmissionStatus } from '@/types/property';
import { useIntegrations } from '@/providers/IntegrationProvider';
import { storageService } from '@/lib/supabase-storage';
import { supabase } from '@/backend/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Direct Supabase helpers — used for static web builds where no tRPC server exists
// ─────────────────────────────────────────────────────────────────────────────

const USE_SUPABASE = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function fetchPropertiesFromSupabase(): Promise<PropertySubmission[]> {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('submittedAt', { ascending: false })
      .limit(50);
    if (error) {
      console.warn('[PropertySubmission] Supabase list error:', error.message);
      return [];
    }
    return (data ?? []) as PropertySubmission[];
  } catch (e) {
    console.warn('[PropertySubmission] Supabase list exception:', e);
    return [];
  }
}

async function insertPropertyToSupabase(submission: PropertySubmission): Promise<PropertySubmission> {
  // Strip fields that may not exist in the schema to avoid 400 errors
  const { id, submittedAt, submissionStatus, ...rest } = submission as any;
  const payload = {
    ...rest,
    id: id ?? crypto.randomUUID(),
    submittedAt: submittedAt ?? new Date().toISOString(),
    submissionStatus: submissionStatus ?? 'pending',
    // Ensure arrays are valid JSON
    photos: Array.isArray(rest.photos) ? rest.photos : [],
    features: Array.isArray(rest.features) ? rest.features : [],
  };

  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.warn('[PropertySubmission] Supabase insert error:', error.message, error.details);
    // Return the local submission as fallback so data is not lost
    return submission;
  }
  return (data ?? submission) as PropertySubmission;
}

// ─────────────────────────────────────────────────────────────────────────────
// tRPC helpers — used when the server is running (native / dev server)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPropertiesViaTrpc(client: any): Promise<PropertySubmission[]> {
  try {
    const result = await client.properties.list.query();
    return result?.data ?? [];
  } catch (e) {
    console.warn('[PropertySubmission] tRPC list failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

async function createPropertyViaTrpc(client: any, payload: any): Promise<PropertySubmission> {
  return await client.properties.create.mutate(payload);
}

export const [PropertySubmissionProvider, usePropertySubmissions] = createContextHook(() => {
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const trpcClientRef = useRef<any>(null);
  const loadAttempted = useRef(false);

  // Try to get the tRPC client — may not be available in static builds
  const getTrpcClient = useCallback(async () => {
    if (trpcClientRef.current) return trpcClientRef.current;
    try {
      const { trpcClient } = await import('@/lib/trpc');
      trpcClientRef.current = trpcClient;
      return trpcClient;
    } catch {
      return null;
    }
  }, []);

  // Determine if tRPC server is available (fails gracefully in static/Vercel)
  const isTrpcAvailable = useCallback(async (): Promise<boolean> => {
    // On web static builds there's no /api/trpc server
    if (Platform.OS === 'web') {
      // Try a quick probe — if it 404s or fails, use Supabase directly
      try {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        if (!base) return false;
        const res = await fetch(`${base}/api/trpc`, { method: 'HEAD' }).catch(() => null);
        if (!res || res.status === 404) return false;
        return true;
      } catch {
        return false;
      }
    }
    return true; // Native always has the bundled server
  }, []);

  const loadSubmissions = useCallback(async (retryCount = 0) => {
    if (loadAttempted.current && retryCount === 0) return;

    try {
      setIsLoading(true);
      loadAttempted.current = true;

      const useTrpc = await isTrpcAvailable();

      if (useTrpc) {
        const client = await getTrpcClient();
        if (client) {
          const data = await fetchPropertiesViaTrpc(client);
          setSubmissions(data);
          return;
        }
      }

      // Fallback: direct Supabase
      if (USE_SUPABASE) {
        const data = await fetchPropertiesFromSupabase();
        setSubmissions(data);
        return;
      }

      setSubmissions([]);
    } catch (error) {
      console.warn('[PropertySubmission] Load failed:', error instanceof Error ? error.message : 'Unknown');
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadSubmissions(retryCount + 1);
      }
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [getTrpcClient, isTrpcAvailable]);

  useEffect(() => {
    const timer = setTimeout(() => loadSubmissions(), 150);
    return () => clearTimeout(timer);
  }, [loadSubmissions]);

  const { connectedIntegrations } = useIntegrations();

  const triggerWebhooks = useCallback(async (submission: PropertySubmission, event: 'created' | 'updated') => {
    try {
      // Webhook integrations (Zapier, Make, custom) — fire-and-forget
    } catch (e) {
      console.error('[Webhook] Failed:', e);
    }
  }, [connectedIntegrations]);

  const addSubmission = useCallback(async (
    submission: Omit<PropertySubmission, 'id' | 'submittedAt' | 'submissionStatus'>
  ) => {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // On web, browser file picker gives blob: URLs; on native, file:// URLs
      const isUploadable = (uri?: string | null) =>
        !!uri && (uri.startsWith('file://') || uri.startsWith('blob:'));

      const hasLocalFiles =
        submission.photos.some(isUploadable) ||
        isUploadable(submission.video) ||
        isUploadable(submission.document);

      let uploadedPhotos: string[] = submission.photos;
      let uploadedVideo: string | undefined = submission.video;
      let uploadedDocument: string | undefined = submission.document;

      if (hasLocalFiles) {
        // Upload photos (file:// or blob:)
        const photosToUpload = submission.photos.filter(isUploadable);
        const photosAlreadyUrl = submission.photos.filter(p => !isUploadable(p));
        if (photosToUpload.length > 0) {
          try {
            const uploaded = await storageService.uploadMultiplePhotos(
              photosToUpload, tempId, () => {}
            );
            uploadedPhotos = [...photosAlreadyUrl, ...uploaded];
          } catch (e) {
            console.warn('[PropertySubmission] Photo upload failed, dropping local URIs');
            // On web, blob: URLs cannot be saved to DB — remove them, keep remote URLs
            uploadedPhotos = photosAlreadyUrl.length > 0 ? photosAlreadyUrl : submission.photos.filter(p => p.startsWith('http'));
          }
        }
        if (isUploadable(submission.video)) {
          try {
            uploadedVideo = await storageService.uploadVideo(submission.video!, tempId);
          } catch (e) {
            console.warn('[PropertySubmission] Video upload failed, dropping');
            uploadedVideo = undefined;
          }
        }
        if (isUploadable(submission.document)) {
          try {
            uploadedDocument = await storageService.uploadDocument(submission.document!, tempId);
          } catch (e) {
            console.warn('[PropertySubmission] Document upload failed, dropping');
            uploadedDocument = undefined;
          }
        }
      }

      const fullSubmission: PropertySubmission = {
        ...submission,
        photos: uploadedPhotos,
        video: uploadedVideo,
        document: uploadedDocument,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        submissionStatus: 'pending',
      };

      let newSubmission: PropertySubmission;

      // On web (Vercel static), always use Supabase directly — no tRPC server
      const useTrpc = await isTrpcAvailable();
      if (useTrpc) {
        const client = await getTrpcClient();
        if (client) {
          try {
            newSubmission = await createPropertyViaTrpc(client, {
              ...submission,
              photos: uploadedPhotos,
              video: uploadedVideo,
              document: uploadedDocument ?? '',
            });
          } catch (trpcErr: any) {
            // Any tRPC failure on web → fall through to Supabase (do NOT rethrow)
            console.warn('[PropertySubmission] tRPC failed, switching to Supabase direct:', trpcErr?.message);
            newSubmission = await insertPropertyToSupabase(fullSubmission);
          }
        } else {
          newSubmission = await insertPropertyToSupabase(fullSubmission);
        }
      } else {
        newSubmission = await insertPropertyToSupabase(fullSubmission);
      }

      // Auto-create agent user record (best-effort — non-blocking)
      try {
        if (submission.agent.phone) {
          const generatedEmail = `${submission.agent.phone.replace(/\D/g, '')}@immoci.com`;
          await supabase.from('users').insert({
            id: crypto.randomUUID(),
            name: submission.agent.name,
            email: generatedEmail,
            role: submission.status === 'sale' ? 'agent' : 'landlord',
            phone: submission.agent.phone,
          }).select().single();
        }
      } catch {
        // Ignore — don't block property submission if user auto-create fails
      }

      setSubmissions(prev => [newSubmission, ...prev]);
      triggerWebhooks(newSubmission, 'created');
      return newSubmission;
    } catch (error) {
      console.error('[PropertySubmission] Create failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  }, [triggerWebhooks, getTrpcClient, isTrpcAvailable]);

  const updateSubmissionStatus = useCallback(async (
    id: string,
    status: SubmissionStatus,
    rejectionReason?: string
  ) => {
    // Try tRPC first, then Supabase direct
    const useTrpc = await isTrpcAvailable();
    if (useTrpc) {
      const client = await getTrpcClient();
      if (client) {
        try {
          const updated = await client.properties.updateStatus.mutate({ id, status, rejectionReason });
          setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
          triggerWebhooks(updated, 'updated');
          return;
        } catch {
          // Fall through to Supabase direct
        }
      }
    }

    // Direct Supabase update
    const { data, error } = await supabase
      .from('properties')
      .update({ submissionStatus: status, reviewedAt: new Date().toISOString(), rejectionReason })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update status: ${error.message}`);
    const updated = data as PropertySubmission;
    setSubmissions(prev => prev.map(s => s.id === id ? updated : s));
    triggerWebhooks(updated, 'updated');
  }, [triggerWebhooks, getTrpcClient, isTrpcAvailable]);

  const getPendingSubmissions = useCallback(() =>
    submissions.filter(s => s.submissionStatus === 'pending'), [submissions]);

  const getApprovedSubmissions = useCallback(() =>
    submissions.filter(s => s.submissionStatus === 'approved'), [submissions]);

  const getRejectedSubmissions = useCallback(() =>
    submissions.filter(s => s.submissionStatus === 'rejected'), [submissions]);

  const getSoldSubmissions = useCallback(() =>
    submissions.filter(s => s.submissionStatus === 'sold'), [submissions]);

  const markAsSold = useCallback(async (id: string, finalPrice?: number, buyerName?: string) => {
    return updateSubmissionStatus(id, 'sold', buyerName ? `Sold to ${buyerName}` : undefined);
  }, [updateSubmissionStatus]);

  const refreshSubmissions = useCallback(() => {
    loadAttempted.current = false;
    loadSubmissions();
  }, [loadSubmissions]);

  return useMemo(() => ({
    submissions,
    isLoading,
    addSubmission,
    updateSubmissionStatus,
    markAsSold,
    getPendingSubmissions,
    getApprovedSubmissions,
    getRejectedSubmissions,
    getSoldSubmissions,
    refreshSubmissions,
  }), [submissions, isLoading, addSubmission, updateSubmissionStatus, markAsSold,
    getPendingSubmissions, getApprovedSubmissions, getRejectedSubmissions, getSoldSubmissions, refreshSubmissions]);
});
