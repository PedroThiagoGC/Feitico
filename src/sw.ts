/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Runtime cache: Supabase REST API calls
registerRoute(
  ({ url }: { url: URL }) =>
    url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/v1/"),
  new NetworkFirst({
    cacheName: "supabase-api",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
  })
);

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json() as {
    title?: string;
    body?: string;
    data?: { url?: string };
  };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Feitiço Admin", {
      body: data.body ?? "",
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      data: data.data,
    })
  );
});

// Open admin panel when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url ?? "/admin"));
});
