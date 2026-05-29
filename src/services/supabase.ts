import { createClient } from '@supabase/supabase-js';

// supabase.ts creates one shared browser client for the whole frontend.
// Any service that needs to read or write data imports this file instead of
// creating its own client instance.

// Vite only exposes environment variables that start with VITE_ to frontend
// code, so the client reads its connection settings from import.meta.env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.');
}

// Shared browser-safe client used by the frontend for inserts/queries allowed
// by your Supabase anon key and row-level security policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

