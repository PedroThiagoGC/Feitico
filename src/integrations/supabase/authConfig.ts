const DEFAULT_AUTH_STORAGE_KEY = "feitico.auth.session";
// Refresh token válido por 2 dias; sem timeout por inatividade (sessão permanente enquanto ativo)
const DEFAULT_REFRESH_TOKEN_DAYS = 2;

function parsePositiveNumber(rawValue: unknown, fallback: number): number {
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

const configuredRefreshTokenDays = parsePositiveNumber(
  import.meta.env.VITE_AUTH_REFRESH_TOKEN_DAYS,
  DEFAULT_REFRESH_TOKEN_DAYS
);

export const SUPABASE_AUTH_STORAGE_KEY =
  (import.meta.env.VITE_AUTH_STORAGE_KEY as string | undefined)?.trim() ||
  DEFAULT_AUTH_STORAGE_KEY;

export const AUTH_SESSION_MAX_DAYS = configuredRefreshTokenDays;
export const AUTH_SESSION_MAX_AGE_MS = configuredRefreshTokenDays * 24 * 60 * 60 * 1000;

// Sem inatividade — sessão permanente enquanto o refresh token não expirar
export const AUTH_INACTIVITY_TIMEOUT_MS = AUTH_SESSION_MAX_AGE_MS;

export const ADMIN_ALLOWED_EMAILS = (import.meta.env.VITE_ADMIN_ALLOWED_EMAILS as string | undefined)
  ?.split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean) ?? [];
