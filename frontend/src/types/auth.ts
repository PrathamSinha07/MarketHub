export type Role = "ROLE_CUSTOMER" | "ROLE_SELLER" | "ROLE_ADMIN";

/** Matches `LoginRequest` from the backend. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches `RegisterRequest` from the backend. */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  storeName?: string;
  storeDescription?: string;
}

/** Matches `AuthResponse` from the backend. */
export interface AuthResponse {
  token: string;
  email: string;
  role: string;
  userId: number;
}

/** Authenticated user exposed to the frontend UI. */
export interface AuthUser {
  userId: number;
  email: string;
  role: Role;
}

/** Session persisted on the client after a successful login or register. */
export interface AuthSession {
  token: string;
  user: AuthUser;
  /** JWT expiry in epoch milliseconds, or null when the token has no exp claim. */
  expiresAt: number | null;
}
