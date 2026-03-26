/// <reference types="vite/client" />

// Globals injected by vite.config.ts define block from process.env at build time.
// This allows Vercel env vars without VITE_ prefix (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY).
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_PUBLISHABLE_KEY__: string;
