import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY || "";

// Defensive dummy client to prevent runtime crashes if variables are missing
const dummySupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signInWithPassword: async () => ({ data: {}, error: { message: "Supabase not configured" } }),
    signUp: async () => ({ data: {}, error: { message: "Supabase not configured" } }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } }),
        single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
    }),
  }),
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (dummySupabase as any);

export const getSupabaseClient = (token?: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    return dummySupabase as any;
  }

  if (token) {
    return createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }
  return supabase;
};