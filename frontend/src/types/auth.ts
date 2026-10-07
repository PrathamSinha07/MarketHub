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
