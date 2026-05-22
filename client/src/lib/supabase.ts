import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.warn('Supabase credentials not set. Auth features will be disabled.');
    return null;
  }
  
  console.log("createClient called. URL:", url, "hasAnonKey:", !!anonKey);
  
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  
  return supabaseInstance;
}
