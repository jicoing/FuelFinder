import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin: SupabaseClient | null = null;

try {
  if (supabaseUrl && (serviceRoleKey || supabaseAnonKey)) {
    const key = serviceRoleKey || supabaseAnonKey;
    supabaseAdmin = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
  } else {
    console.error('CRITICAL: SUPABASE_URL or Auth Keys missing. Admin features will fail.');
  }
} catch (e) {
  console.error('Error initializing Supabase Admin:', e);
}

export { supabaseAdmin };