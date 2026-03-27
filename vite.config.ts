import { defineConfig } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(async ({ mode }: { mode: string }) => {
  // Avoid hard failure in CI/CD environments that install only production deps.
  const plugins: PluginOption[] = [react()];
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
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        injectRegister: "auto",
        registerType: "autoUpdate",
        manifest: false,
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
      }),
    ],
    envPrefix: ["VITE_"],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
