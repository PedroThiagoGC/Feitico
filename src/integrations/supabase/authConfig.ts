const DEFAULT_AUTH_STORAGE_KEY = "feitico.auth.session";
const DEFAULT_SESSION_MAX_DAYS = 15;
const DEFAULT_INACTIVITY_HOURS = 24;

function parsePositiveNumber(rawValue: unknown, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

const configuredSessionDays = parsePositiveNumber(
  import.meta.env.VITE_AUTH_SESSION_MAX_DAYS,
  DEFAULT_SESSION_MAX_DAYS
);

const configuredInactivityHours = parsePositiveNumber(
  import.meta.env.VITE_AUTH_INACTIVITY_HOURS,
  DEFAULT_INACTIVITY_HOURS
);

export const SUPABASE_AUTH_STORAGE_KEY =
  (import.meta.env.VITE_AUTH_STORAGE_KEY as string | undefined)?.trim() ||
  DEFAULT_AUTH_STORAGE_KEY;

export const AUTH_SESSION_MAX_DAYS = configuredSessionDays;
export const AUTH_SESSION_MAX_AGE_MS = configuredSessionDays * 24 * 60 * 60 * 1000;

export const AUTH_INACTIVITY_TIMEOUT_MS = Math.min(
  configuredInactivityHours * 60 * 60 * 1000,
  AUTH_SESSION_MAX_AGE_MS
);

export const ADMIN_ALLOWED_EMAILS = (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS as string | undefined)
  ?.split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean) ?? [];
