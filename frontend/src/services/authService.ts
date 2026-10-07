import { apiClient } from "@/lib/api-client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

/** Service for the Spring Boot authentication API (`/auth`). */
export const authService = {
  login(request: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", request);
  },

  register(request: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", request);
  },
};
