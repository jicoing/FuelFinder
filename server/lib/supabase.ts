import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabaseAdmin: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

export { supabaseAdmin };