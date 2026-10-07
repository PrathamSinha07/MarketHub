import type { AuthSession } from "@/types/auth";

/**
 * Client-side session storage.
 *
 * The backend returns the JWT in the login/register response body (it
 * does not set a cookie), so localStorage is the storage mechanism this
 * app uses. The token is attached to API requests by `lib/api-client.ts`.
 *
 * Note: localStorage is readable by same-origin JavaScript and is
 * therefore XSS-exposed; an httpOnly cookie would be safer but requires
 * backend changes (out of scope for the frontend task).
 */
export const SESSION_STORAGE_KEY = "markethub.session";

/** Previous storage key from the initial session helper, cleaned up on access. */
const LEGACY_TOKEN_STORAGE_KEY = "markethub.authToken";

/** Custom event dispatched when the backend rejects a token (401). */
export const SESSION_EXPIRED_EVENT = "markethub:session-expired";

function isValidSession(value: unknown): value is AuthSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  );
}

/** Reads the persisted session from localStorage, or null when absent/invalid. */
export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Persists a session to localStorage. */
export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode, quota exceeded) — the session
    // will only last for the current page load.
  }
}

/** Removes the persisted session. */
export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors on logout.
  }
}

/** Token accessor used by the API client for Authorization headers. */
export function getAuthToken(): string | null {
  return getAuthSession()?.token ?? null;
}

/** A session with an expiry is expired once that moment has passed. */
export function isSessionExpired(session: AuthSession): boolean {
  return session.expiresAt !== null && session.expiresAt <= Date.now();
}

/** Notifies the app (e.g. the auth context) that the session is no longer valid. */
export function notifySessionExpired(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
