import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(async ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_", "SUPABASE_"]);

  // process.env is available here at build time (Vercel injects all dashboard vars).
  // We use define to bundle them even without VITE_ prefix.
  const supabaseUrlValue =
    process.env.SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    "";
  const supabaseKeyValue =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  const supabaseUrl = supabaseUrlValue;
  const supabaseApiPattern = supabaseUrl
    ? new RegExp(`^${supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/rest/v1/.*`, "i")
    : /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/i;

  // Avoid hard failure in CI/CD environments that install only production deps.
  const plugins: any[] = [react()];
  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch {
      // Optional plugin for local dev only.
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      ...plugins,
      VitePWA({
        injectRegister: "auto",
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt", "manifest.webmanifest"],
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: supabaseApiPattern,
              handler: "NetworkFirst",
              options: {
                cacheName: "supabase-api",
                expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              },
            },
          ],
        },
      }) as any,
    ],
    envPrefix: ["VITE_", "SUPABASE_"],
    define: {
      __SUPABASE_URL__: JSON.stringify(supabaseUrlValue),
      __SUPABASE_PUBLISHABLE_KEY__: JSON.stringify(supabaseKeyValue),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
