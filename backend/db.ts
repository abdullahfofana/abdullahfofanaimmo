import { supabase } from './supabase';

interface Database {
  properties: any[];
  users: any[];
  activities: any[];
}

const defaultDb: Database = {
  properties: [],
  users: [],
  activities: [],
};

const USE_SUPABASE = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let inMemoryDb: Database = { ...defaultDb };

if (!USE_SUPABASE) {
  console.log('[Database] Using in-memory fallback (data will not persist between restarts)');
}

export const db = {
  read: (): Database => {
    if (USE_SUPABASE) {
      return defaultDb;
    }
    return { ...inMemoryDb };
  },
  write: (data: Database) => {
    if (USE_SUPABASE) {
      return;
    }
    inMemoryDb = { ...data };
  }
};

export { supabase, USE_SUPABASE };
