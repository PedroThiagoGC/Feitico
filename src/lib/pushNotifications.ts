import { supabase } from "@/integrations/supabase/client";

// Public VAPID key — safe to commit (not a secret)
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ??
  "BOacju5n6qwmUdXZzrJ5sN7rX7diBujaHrXRcq7lEZTOCDyT8rGpMDliAFdmfO_5kzeK_HI0FwBWscFBb6A_bvQ";

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushStatus = "granted" | "denied" | "default" | "unsupported";

export function getPushStatus(): PushStatus {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PushStatus;
}

export async function subscribeToPush(salonId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const keys = json.keys as { p256dh: string; auth: string };
  const { error } = await (supabase as any)
    .from("push_subscriptions")
    .upsert(
      {
        salon_id: salonId,
        endpoint: json.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        device_label: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      },
      { onConflict: "salon_id,endpoint" }
    );

  return !error;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await (supabase as any).from("push_subscriptions").delete().eq("endpoint", endpoint);
}
