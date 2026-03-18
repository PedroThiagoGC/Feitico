import { useCallback, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/opr|opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua) && !/edg|opr|opera/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "Safari";
  return "navegador";
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const host = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const browserName = detectBrowser(ua);
  const isLovableHost = host === "lovable.dev" || host.endsWith(".lovable.dev");

  useEffect(() => {
    const checkStandalone = () => {
      const standaloneByDisplayMode = window.matchMedia("(display-mode: standalone)").matches;
      const standaloneByNavigator = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(standaloneByDisplayMode || standaloneByNavigator);
    };

    checkStandalone();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canPromptInstall = Boolean(deferredPrompt) && !isLovableHost;

  const installInstructions = useMemo(() => {
    if (isLovableHost) {
      return "Instale o app pelo dominio oficial do projeto. Em lovable.dev o atalho abre o proprio lovable.";
    }

    if (canPromptInstall) return "Clique em Instalar app para adicionar na tela inicial.";

    if (isIos) {
      return "No Safari: Compartilhar -> Adicionar a Tela de Inicio.";
    }

    if (isAndroid && browserName === "Firefox") {
      return "No Firefox Android: menu do navegador -> Instalar ou Adicionar a tela inicial.";
    }

    return `No ${browserName}: abra o menu do navegador e procure por Instalar app ou Adicionar a tela inicial.`;
  }, [canPromptInstall, isIos, isAndroid, browserName, isLovableHost]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (result.outcome === "accepted") {
      setIsStandalone(true);
    }

    return result;
  }, [deferredPrompt]);

  return {
    browserName,
    canPromptInstall,
    installInstructions,
    isIos,
    isLovableHost,
    isStandalone,
    promptInstall,
  };
}
