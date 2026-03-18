import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseApiPattern = supabaseUrl
    ? new RegExp(`^${supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/rest/v1/.*`, "i")
    : /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/i;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "robots.txt"],
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
        manifest: {
          name: "Salão Admin - Painel de Gestão",
          short_name: "Salão Admin",
          description: "Painel administrativo para gestão de salão de beleza",
          theme_color: "#0B0B0B",
          background_color: "#0B0B0B",
          display: "standalone",
          orientation: "any",
          start_url: "/admin",
          scope: "/",
          icons: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
