import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";

const PREFIX = "feitico:form:";

/**
 * Persiste os valores de um formulário React Hook Form no localStorage.
 * Pensado para PWA: salva automaticamente conforme o usuário preenche,
 * restaura na próxima vez que o componente montar.
 *
 * @param form     instância de useForm
 * @param key      chave única no localStorage (ex: "booking", "admin-salon")
 * @param onClear  (opcional) callback chamado após clearPersisted
 *
 * Retorna `clearPersisted()` — chame no submit bem-sucedido.
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  key: string
) {
  const storageKey = `${PREFIX}${key}`;
  const isRestored = useRef(false);

  // Restaura do localStorage na primeira montagem
  useEffect(() => {
    if (isRestored.current) return;
    isRestored.current = true;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<T>;
      // reset não dispara validação — só preenche os campos
      form.reset({ ...form.getValues(), ...saved });
    } catch {
      // JSON malformado ou permissão negada — ignora silenciosamente
    }
  }, [form, storageKey]);

  // Salva sempre que os valores mudam
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
      } catch {
        // storage cheio ou modo privado sem permissão
      }
    });
    return () => subscription.unsubscribe();
  }, [form, storageKey]);

  function clearPersisted() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // silencioso
    }
  }

  return { clearPersisted };
}

/**
 * Persiste um valor genérico (não-formulário) no localStorage.
 * Útil para step atual do booking, seleções intermediárias, etc.
 */
export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  const storageKey = `${PREFIX}${key}`;

  function get(): T {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  function set(value: T) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // silencioso
    }
  }

  function clear() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // silencioso
    }
  }

  return [get(), set, clear];
}
