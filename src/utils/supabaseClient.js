import { createClient } from '@supabase/supabase-js';

// Production Supabase Cloud configuration (with environment variable override support)
const DEFAULT_SUPABASE_URL = 'https://yooomplbpzfryuifgevc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_U4EMNoyiYvY5yTkmvEpBbA__0tx5K9Q';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id')
      .limit(1);

    if (error) {
      console.warn('Supabase connection test failed:', error);
      return { connected: false, error };
    }

    return { connected: true, error: null, data };
  } catch (err) {
    console.warn('Supabase network error:', err);
    return { connected: false, error: err };
  }
};

