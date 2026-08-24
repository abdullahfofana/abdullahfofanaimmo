import { z } from "zod";
import { createTRPCRouter, publicProcedure, authedProcedure } from "../../create-context";
import { addActivity } from "../activities/route";
import { PropertySubmission, SubmissionStatus } from "@/types/property";
import { db, supabase, USE_SUPABASE } from "@/backend/db";
import { moderateProperty } from "@/backend/ai";

let submissions: PropertySubmission[] = USE_SUPABASE ? [] : db.read().properties;

export const propertiesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['pending', 'approved', 'rejected', 'sold', 'rented', 'all']).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const statusFilter = input?.status && input.status !== 'all' ? input.status : undefined;

      if (USE_SUPABASE) {
        try {
          let query = supabase
            .from('properties')
            .select('*', { count: 'exact' })
            .order('submittedAt', { ascending: false });

          if (statusFilter) {
            query = query.eq('submissionStatus', statusFilter);
          }

          const { data, error, count } = await query.range(offset, offset + limit - 1);

          if (!error && data) {
            return { data: data as PropertySubmission[], total: count ?? 0, offset, limit };
          }
          console.warn('[Properties] fetch failed, falling back to local DB:', error ? error.message : 'No data');
        } catch (e) {
          console.warn('[Properties] fetch exception, falling back to local DB');
        }
      }

      let all = db.read().properties;
      if (statusFilter) {
        all = all.filter((p: any) => p.submissionStatus === statusFilter);
      }
      const paginated = all.slice(offset, offset + limit);
      return { data: paginated, total: all.length, offset, limit };
    }),

  // Public: any user (logged-in or guest) may submit a property listing
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        price: z.number(),
        type: z.enum(['apartment', 'house', 'villa', 'land', 'commercial']),
        status: z.enum(['sale', 'rent']),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        area: z.number(),
        location: z.object({
          address: z.string(),
          city: z.string(),
          district: z.string(),
          coordinates: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }).optional(),
        }),
        photos: z.array(z.string()),
        video: z.string().optional(),
        document: z.string().optional(),
        features: z.array(z.string()),
        agent: z.object({
          name: z.string(),
          phone: z.string(),
        }),
        payment: z.object({
          method: z.enum(['orange_money', 'mtn_money', 'moov', 'wave']),
          transactionId: z.string(),
          amount: z.number(),
        }),
        is_test: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // ── 1. Duplicate Prevention ──
        if (USE_SUPABASE) {
          try {
            const { data: existing } = await supabase
              .from('properties')
              .select('id, title, agent')
              .eq('title', input.title)
              .limit(1);

            if (existing && existing.length > 0) {
              const matched = existing[0] as any;
              if (matched.agent?.phone === input.agent.phone) {
                console.warn('[Properties] Duplicate property submission detected:', input.title);
              }
            }
          } catch {
            // non-fatal duplicate check error
          }
        } else {
          const currentList = db.read().properties;
          const duplicate = currentList.find((p: any) =>
            p.title.toLowerCase().trim() === input.title.toLowerCase().trim() &&
            p.agent?.phone === input.agent.phone
          );
          if (duplicate) {
            console.warn('[Properties] Duplicate property submission detected in local DB:', input.title);
          }
        }

        // ── 2. AI Pre-screening Moderation ──
        let moderationResult: { approved: boolean; reason?: string } = { approved: true };
        try {
          moderationResult = await moderateProperty({
            title: input.title,
            description: input.description,
            price: input.price,
            type: input.type,
            location: { city: input.location.city, district: input.location.district },
            features: input.features,
          });
        } catch (aiErr) {
          console.warn('[Properties] AI moderation pre-screening skipped:', aiErr);
        }

        const newSubmission: PropertySubmission = {
          ...input,
          id: crypto.randomUUID(),
          submittedAt: new Date().toISOString(),
          submissionStatus: 'pending',
          document: input.document || '',
          rejectionReason: moderationResult.approved ? undefined : `AI Flag: ${moderationResult.reason || 'Flagged for review'}`,
        };

        if (USE_SUPABASE) {
          try {
            const { data, error } = await supabase
              .from('properties')
              .insert(newSubmission)
              .select()
              .single();

            if (!error && data) {
              await addActivity({
                type: 'property_listed',
                message: `New property submitted: ${input.title} (${input.price.toLocaleString()} FCFA)`,
                user: input.agent.name,
              });
              return data as PropertySubmission;
            }
            console.warn('[Properties] insert failed, falling back to local DB:', error ? error.message : 'No data');
          } catch (e) {
            console.warn('[Properties] insert exception, falling back to local DB');
          }
        }

        // Fallback to local DB
        submissions.unshift(newSubmission);

        const currentDb = db.read();
        currentDb.properties = submissions;
        db.write(currentDb);

        await addActivity({
          type: 'property_listed',
          message: `New property submitted: ${input.title} (${input.price.toLocaleString()} FCFA)`,
          user: input.agent.name,
        });

        return newSubmission;
      } catch (error) {
        console.error('[Properties] Create error:', error instanceof Error ? error.message : error);
        throw error;
      }
    }),

  // Requires auth: admins or agents may update listing status
  updateStatus: authedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['pending', 'approved', 'rejected', 'sold', 'rented']),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const isSoldOrRented = input.status === 'sold' || input.status === 'rented';

      if (USE_SUPABASE) {
        const { data: submission, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', input.id)
          .single();

        if (fetchError || !submission) {
          throw new Error('Submission not found');
        }

        const updatedData = {
          submissionStatus: input.status,
          reviewedAt: new Date().toISOString(),
          rejectionReason: input.rejectionReason,
        };

        const { data, error } = await supabase
          .from('properties')
          .update(updatedData)
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          console.error('[Properties] Update error:', error.message);
          throw new Error(`Failed to update property: ${error.message}`);
        }

        await addActivity({
          type: isSoldOrRented ? 'property_sold' : 'property_verified',
          message: isSoldOrRented
            ? `Property marked as ${input.status}: ${submission.title} (${submission.price?.toLocaleString() || ''} FCFA)`
            : `Property ${input.status}: ${submission.title}`,
          user: 'Admin',
        });

        return data as PropertySubmission;
      } else {
        const submissionIndex = submissions.findIndex((s) => s.id === input.id);
        if (submissionIndex === -1) {
          throw new Error("Submission not found");
        }

        const submission = submissions[submissionIndex];
        const updatedSubmission = {
          ...submission,
          submissionStatus: input.status as SubmissionStatus,
          reviewedAt: new Date().toISOString(),
          rejectionReason: input.rejectionReason,
        };

        submissions[submissionIndex] = updatedSubmission;

        const currentDb = db.read();
        currentDb.properties = submissions;
        db.write(currentDb);

        await addActivity({
          type: isSoldOrRented ? 'property_sold' : 'property_verified',
          message: isSoldOrRented
            ? `Property marked as ${input.status}: ${submission.title} (${submission.price?.toLocaleString() || ''} FCFA)`
            : `Property ${input.status}: ${submission.title}`,
          user: 'Admin',
        });

        return updatedSubmission;
      }
    }),

  // Mark property as sold or rented with sales details
  markAsSold: authedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['sold', 'rented']).default('sold'),
        finalPrice: z.number().optional(),
        buyerName: z.string().optional(),
        agentCommission: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const submissionIndex = submissions.findIndex((s) => s.id === input.id);
      const property = submissions[submissionIndex];
      const title = property?.title || 'Propriété';
      const amount = input.finalPrice || property?.price || 0;

      await addActivity({
        type: 'property_sold',
        message: `Transaction conclue: ${title} vendu pour ${amount.toLocaleString()} FCFA ${input.buyerName ? `à ${input.buyerName}` : ''}`,
        user: input.buyerName || 'Agent',
      });

      return {
        success: true,
        id: input.id,
        status: input.status,
        amount,
        recordedAt: new Date().toISOString(),
      };
    }),
});
