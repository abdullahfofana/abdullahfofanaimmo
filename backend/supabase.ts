import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Credentials not configured. Using local JSON fallback.');
} else if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('[Supabase] Invalid URL format. Using local JSON fallback.');
} else {
  console.log('[Supabase] ✅ Connected to', supabaseUrl.substring(0, 30) + '...');
}

const createFallbackClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      data: null,
      error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' },
      order: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      limit: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      eq: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      single: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => ({
          data: null,
          error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
        })
      })
    }),
    update: (data: any) => ({
      eq: () => ({
        select: () => ({
          single: () => ({
            data: null,
            error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' }
          })
        })
      })
    }),
    delete: () => ({
      eq: () => ({ error: { message: 'Supabase not configured', code: 'SUPABASE_NOT_CONFIGURED' } }),
    }),
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: { message: 'Supabase not configured' } }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({
        data: null,
        error: { message: 'Supabase storage not configured', code: 'SUPABASE_NOT_CONFIGURED' }
      }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: '' },
        error: { message: 'Supabase storage not configured' }
      }),
    }),
  }
} as any);

const createSafeClient = () => {
  if (!supabaseUrl || !supabaseKey || (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://'))) {
    return createFallbackClient();
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,   // Store session across restarts
        autoRefreshToken: true, // Refresh JWT before expiry to avoid silent 401s
      },
    });
  } catch (error) {
    console.error('[Supabase] Failed to create client:', error);
    return createFallbackClient();
  }
};

export const supabase = createSafeClient();

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          type: 'apartment' | 'house' | 'villa' | 'land' | 'commercial';
          status: 'sale' | 'rent';
          bedrooms?: number;
          bathrooms?: number;
          area: number;
          location: {
            address: string;
            city: string;
            district: string;
            coordinates?: {
              latitude: number;
              longitude: number;
            };
          };
          photos: string[];
          video?: string;
          document?: string;
          features: string[];
          agent: {
            name: string;
            phone: string;
          };
          payment: {
            method: 'orange_money' | 'mtn_money' | 'moov' | 'wave';
            transactionId: string;
            amount: number;
          };
          submissionStatus: 'pending' | 'approved' | 'rejected';
          submittedAt: string;
          reviewedAt?: string;
          rejectionReason?: string;
          is_test?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['properties']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'admin' | 'agent' | 'landlord' | 'renter';
          phone?: string;
          avatar?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          type: string;
          message: string;
          user: string;
          timestamp: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
    };
  };
}

export async function initializeSupabaseTables() {
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: 'No credentials' };
  }

  try {
    const { error } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Supabase] Table access error:', error.message);
      return { success: false, error: error.message, code: error.code };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Supabase] Init failed:', error.message);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
