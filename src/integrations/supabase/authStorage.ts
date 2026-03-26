type SimpleStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type SessionEnvelope = {
  version: 1;
  value: string;
  createdAt: number;
  lastUsedAt: number;
  expiresAt: number;
  inactivityExpiresAt: number;
};

type CreateAuthStorageOptions = {
  storageKey: string;
  sessionMaxAgeMs: number;
  inactivityTimeoutMs: number;
  storage?: SimpleStorage;
};

const INACTIVITY_TOUCH_INTERVAL_MS = 60_000;

function createInMemoryStorage(): SimpleStorage {
  const memoryStore = new Map<string, string>();

  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => memoryStore.set(key, value),
    removeItem: (key) => memoryStore.delete(key),
  };
}

function resolveStorage(storage?: SimpleStorage): SimpleStorage {
  if (storage) return storage;

  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return createInMemoryStorage();
}

function parseEnvelope(raw: string | null): SessionEnvelope | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SessionEnvelope>;
    if (parsed.version !== 1) return null;
    if (typeof parsed.value !== "string") return null;
    if (typeof parsed.createdAt !== "number") return null;
    if (typeof parsed.lastUsedAt !== "number") return null;
    if (typeof parsed.expiresAt !== "number") return null;
    if (typeof parsed.inactivityExpiresAt !== "number") return null;
    return parsed as SessionEnvelope;
  } catch {
    return null;
  }
}

function isSessionExpired(envelope: SessionEnvelope, now: number): boolean {
  return now >= envelope.expiresAt || now >= envelope.inactivityExpiresAt;
}

export function createAuthStorage(options: CreateAuthStorageOptions): SimpleStorage {
  const baseStorage = resolveStorage(options.storage);
  const { storageKey, sessionMaxAgeMs, inactivityTimeoutMs } = options;

  const safeGetItem = (key: string): string | null => {
    try {
      return baseStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeSetItem = (key: string, value: string): void => {
    try {
      baseStorage.setItem(key, value);
    } catch {
      // Ignore write failures (quota/private mode) and let Supabase continue in-memory.
    }
  };

  const safeRemoveItem = (key: string): void => {
    try {
      baseStorage.removeItem(key);
    } catch {
      // Ignore removal failures.
    }
  };

  const readStoredEnvelope = (): SessionEnvelope | null => {
    const currentRaw = safeGetItem(storageKey);
    return parseEnvelope(currentRaw);
  };

  return {
    getItem(key: string): string | null {
      const rawValue = safeGetItem(key);
      if (key !== storageKey || rawValue === null) {
        return rawValue;
      }

      const envelope = parseEnvelope(rawValue);
      if (!envelope) {
        // Backward compatibility: keep supporting the old raw session payload format.
        return rawValue;
      }

      const now = Date.now();
      if (isSessionExpired(envelope, now)) {
        safeRemoveItem(key);
        return null;
      }

      if (now - envelope.lastUsedAt >= INACTIVITY_TOUCH_INTERVAL_MS) {
        const refreshedEnvelope: SessionEnvelope = {
          ...envelope,
          lastUsedAt: now,
          inactivityExpiresAt: now + inactivityTimeoutMs,
        };
        safeSetItem(key, JSON.stringify(refreshedEnvelope));
      }

      return envelope.value;
    },
    setItem(key: string, value: string): void {
      if (key !== storageKey) {
        safeSetItem(key, value);
        return;
      }

      const now = Date.now();
      const previousEnvelope = readStoredEnvelope();
      const createdAt = previousEnvelope?.createdAt ?? now;

      const nextEnvelope: SessionEnvelope = {
        version: 1,
        value,
        createdAt,
        lastUsedAt: now,
        expiresAt: createdAt + sessionMaxAgeMs,
        inactivityExpiresAt: now + inactivityTimeoutMs,
      };

      safeSetItem(key, JSON.stringify(nextEnvelope));
    },
    removeItem(key: string): void {
      safeRemoveItem(key);
    },
  };
}
