const AUTH_TOKEN_KEY = "markethub.authToken";

/**
 * Reads the JWT from localStorage when one has been stored by the
 * authentication flow. Returns null when no session exists yet.
 *
 * Authentication state management is intentionally not implemented yet;
 * this helper exists so the API client and UI can wire it in cleanly.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}
