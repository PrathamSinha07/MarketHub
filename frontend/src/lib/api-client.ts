import { API_BASE_URL } from "@/lib/config";
import {
  clearAuthSession,
  getAuthToken,
  notifySessionExpired,
} from "@/lib/session";
import type { ApiResponse, FieldErrors } from "@/types/api";

/**
 * Error thrown for every non-2xx API response. Carries the HTTP status,
 * the backend `message`, and any field-level validation errors.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const token = getAuthToken();
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the MarketHub API. Check your connection and try again."
    );
  }

  let payload: ApiResponse<T> | null = null;
  const raw = await response.text();
  if (raw) {
    try {
      payload = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      // The token was rejected or expired — drop the persisted
      // session and let the auth context sign the user out.
      clearAuthSession();
      notifySessionExpired();
    }
    const message =
      payload && typeof payload.message === "string" && payload.message.length > 0
        ? payload.message
        : `Request failed with status ${response.status}`;
    const fieldErrors =
      payload?.errors && typeof payload.errors === "object"
        ? (payload.errors as FieldErrors)
        : undefined;
    throw new ApiError(response.status, message, fieldErrors);
  }

  return payload?.data as T;
}

/** Typed fetch wrapper around the Spring Boot API. */
export const apiClient = {
  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return request<T>("GET", path, undefined, headers);
  },
  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return request<T>("POST", path, body, headers);
  },
  put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return request<T>("PUT", path, body, headers);
  },
  del<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return request<T>("DELETE", path, undefined, headers);
  },
};
