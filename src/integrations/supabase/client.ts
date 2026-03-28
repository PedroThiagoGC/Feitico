import { createClient } from "@supabase/supabase-js";
import { SUPABASE_AUTH_STORAGE_KEY } from "./authConfig";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const SUPABASE_PROJECT_ID = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined)?.trim();

function getProjectRefFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Supabase: configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente da Vercel."
  );
}

const projectRefFromUrl = getProjectRefFromUrl(SUPABASE_URL);
if (
  SUPABASE_PROJECT_ID &&
  projectRefFromUrl &&
  SUPABASE_PROJECT_ID !== projectRefFromUrl
) {
  const mismatchMessage =
    `Supabase: VITE_SUPABASE_PROJECT_ID (${SUPABASE_PROJECT_ID}) ` +
    `não bate com o projeto da VITE_SUPABASE_URL (${projectRefFromUrl}).`;

  if (import.meta.env.DEV) {
    throw new Error(mismatchMessage);
  }

  console.error(mismatchMessage);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
  },
});
