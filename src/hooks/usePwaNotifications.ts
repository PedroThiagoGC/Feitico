import { useCallback, useMemo, useState } from "react";

type NotificationPermissionState = "default" | "denied" | "granted";

export function usePwaNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const isSupported = useMemo(
    () => typeof window !== "undefined" && "Notification" in window,
    []
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) return "default" as NotificationPermissionState;

    const next = await Notification.requestPermission();
    setPermission(next);
    return next;
  }, [isSupported]);

  const notifyTest = useCallback(async () => {
    if (!isSupported) return false;

    let current = permission;
    if (current !== "granted") {
      current = await requestPermission();
    }

    if (current !== "granted") return false;

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification("Feitico", {
          body: "Notificacoes ativadas com sucesso.",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: "feitico-notification-test",
        });
        return true;
      }
    }

    new Notification("Feitico", {
      body: "Notificacoes ativadas com sucesso.",
      icon: "/pwa-192x192.png",
    });

    return true;
  }, [isSupported, permission, requestPermission]);

  return {
    isSupported,
    notifyTest,
    permission,
    requestPermission,
  };
}
