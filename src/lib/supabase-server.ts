import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // For DEV/preview deployments, use DEV key first
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY_DEV || process.env.SUPABASE_SERVICE_KEY!;
  
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_KEY_DEV must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
