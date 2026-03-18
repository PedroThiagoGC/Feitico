import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { usePwaNotifications } from "@/hooks/usePwaNotifications";
import { appToast } from "@/lib/toast";

export default function PwaAssistant() {
  const [dismissed, setDismissed] = useState(false);
  const { browserName, canPromptInstall, installInstructions, isStandalone, promptInstall } = usePwaInstall();
  const { isSupported, notifyTest, permission, requestPermission } = usePwaNotifications();

  if (dismissed || (isStandalone && permission === "granted")) {
    return null;
  }

  const handleInstall = async () => {
    if (!canPromptInstall) {
      appToast.info(installInstructions);
      return;
    }

    const result = await promptInstall();
    if (!result) return;

    if (result.outcome === "accepted") {
      appToast.success("App instalado com sucesso.");
    } else {
      appToast.info("Instalacao cancelada. Voce pode tentar novamente.");
    }
  };

  const handleEnableNotifications = async () => {
    const next = await requestPermission();
    if (next === "granted") {
      appToast.success("Permissao de notificacoes concedida.");
      return;
    }

    if (next === "denied") {
      appToast.error("Permissao negada. Ative manualmente nas configuracoes do navegador.");
      return;
    }

    appToast.info("Permissao ainda nao concedida.");
  };

  const handleTestNotification = async () => {
    const success = await notifyTest();
    if (success) appToast.success("Notificacao de teste enviada.");
    else appToast.error("Nao foi possivel enviar notificacao de teste.");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[min(92vw,360px)] rounded-xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur">
      <div className="mb-3">
        <p className="font-body text-sm font-semibold text-foreground">App e Notificacoes</p>
        <p className="font-body text-xs text-muted-foreground">Navegador detectado: {browserName}</p>
      </div>

      {!isStandalone && (
        <div className="mb-3 space-y-2">
          <Button type="button" onClick={handleInstall} className="w-full" size="sm">
            {canPromptInstall ? "Instalar app" : "Ver como instalar"}
          </Button>
          <p className="font-body text-xs text-muted-foreground">{installInstructions}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="button"
          variant={permission === "granted" ? "secondary" : "default"}
          onClick={handleEnableNotifications}
          className="w-full"
          size="sm"
          disabled={!isSupported || permission === "granted"}
        >
          {!isSupported
            ? "Notificacao nao suportada"
            : permission === "granted"
              ? "Notificacoes ativas"
              : "Permitir notificacoes"}
        </Button>

        {isSupported && permission === "granted" && (
          <Button type="button" variant="outline" onClick={handleTestNotification} className="w-full" size="sm">
            Enviar notificacao de teste
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        className="mt-3 h-7 w-full text-xs text-muted-foreground"
        onClick={() => setDismissed(true)}
      >
        Fechar
      </Button>
    </div>
  );
}
