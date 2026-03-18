import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseApiPattern = supabaseUrl
    ? new RegExp(`^${supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/rest/v1/.*`, "i")
    : /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*$/i;

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
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
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
