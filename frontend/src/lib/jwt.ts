/**
 * Minimal JWT payload decoder.
 *
 * The frontend only needs the standard `exp`, `sub` and `role` claims
 * (expiry checks and session restore). Signature verification always
 * happens on the backend — the client never trusts the payload for
 * authorization decisions.
 */
interface JwtPayload {
  exp?: number;
  sub?: string;
  role?: string;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(encoded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}
