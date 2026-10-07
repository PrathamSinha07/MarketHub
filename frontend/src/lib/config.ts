/**
 * Central environment configuration for the MarketHub frontend.
 *
 * The Spring Boot backend is served under the `/api/v1` context path, so the
 * base URL must include it (e.g. http://localhost:8080/api/v1).
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1"
).replace(/\/+$/, "");
