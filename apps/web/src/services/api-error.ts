import { AxiosError } from "axios";

interface ApiErrorData {
  message?: string;
  error?: { message?: string; code?: string };
}

/**
 * Extracts a human-readable error message from an Axios error response.
 * Falls back to a generic message when the response shape is unexpected.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred. Please try again.",
): string {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as ApiErrorData;
    return data.message || data.error?.message || fallback;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
