import { toast as sonnerToast } from "sonner";

/**
 * Wrapper padronizado sobre Sonner.
 * Garante duração, posição e mensagens consistentes em todo o app.
 */
const DURATION = 4000;

export const appToast = {
  success(message: string) {
    sonnerToast.success(message, { duration: DURATION });
  },
  error(message: string | Error | unknown) {
    const text =
      message instanceof Error
        ? message.message
        : typeof message === "string"
          ? message
          : "Ocorreu um erro inesperado";
    sonnerToast.error(text, { duration: DURATION + 2000 });
  },
  info(message: string) {
    sonnerToast.info(message, { duration: DURATION });
  },
  warning(message: string) {
    sonnerToast.warning(message, { duration: DURATION });
  },
  /** Exibe toast de resultado de operação Supabase (error/success). */
  fromResult(result: { error: { message: string } | null }, successMsg: string) {
    if (result.error) {
      appToast.error(result.error.message);
    } else {
      appToast.success(successMsg);
    }
  },
};
