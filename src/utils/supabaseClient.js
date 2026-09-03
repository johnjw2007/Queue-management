import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Add it to Vercel Environment Variables and redeploy.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Add it to Vercel Environment Variables and redeploy.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const testSupabaseConnection = async () => {
  const { error } = await supabase
    .from('departments')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Supabase connection/table test failed:', error);
    return { connected: false, error };
  }

  return { connected: true, error: null };
};
