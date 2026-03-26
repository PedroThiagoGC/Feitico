import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// __SUPABASE_URL__ e __SUPABASE_PUBLISHABLE_KEY__ são injetados pelo define do vite.config.ts
// a partir de process.env no momento do build — funciona com ou sem prefixo VITE_ na Vercel.
const SUPABASE_URL =
  __SUPABASE_URL__ ||
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_PUBLISHABLE_KEY =
  __SUPABASE_PUBLISHABLE_KEY__ ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase: configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY (ou SUPABASE_ANON_KEY) na Vercel.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});