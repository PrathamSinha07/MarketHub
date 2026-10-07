/** Envelope used by every Spring Boot endpoint in MarketHub. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  /** Validation errors keyed by field name, present when the request fails validation. */
  errors?: Record<string, string> | null;
  timestamp: string;
}

export type FieldErrors = Record<string, string>;
