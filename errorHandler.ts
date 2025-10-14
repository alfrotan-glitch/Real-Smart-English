// src/utils/errorHandler.ts
// =============================================================================
// Unified API Error Handler — Real Smart English 2025
// - Pure functions, side-effect free, TS5/ESM friendly.
// - Normalizes common HTTP/API/fetch errors into stable UI messages.
// - Detects: 401/403/404/408/413/422/429, 5xx, AbortError, timeouts, network.
// =============================================================================

type AnyRecord = Record<string, any>;

const isObject = (v: unknown): v is AnyRecord => typeof v === "object" && v !== null;

const pickFirst = (...vals: Array<unknown>): string | undefined => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
};

const toStatus = (err: unknown): number | undefined => {
  if (!isObject(err)) return undefined;
  const e = err as AnyRecord;
  // Common shapes: fetch Response-like, Axios, custom
  return (
    (typeof e.status === "number" ? e.status : undefined) ??
    (typeof e.statusCode === "number" ? e.statusCode : undefined) ??
    (isObject(e.response) && typeof (e.response as AnyRecord).status === "number"
      ? (e.response as AnyRecord).status
      : undefined)
  );
};

const toMessage = (err: unknown): string | undefined => {
  if (!isObject(err)) return typeof err === "string" ? err : undefined;
  const e = err as AnyRecord;
  // Prefer nested API messages, then surface message/statusText
  return (
    pickFirst(
      e.error?.message,
      e.response?.data?.error?.message,
      e.response?.data?.message,
      e.data?.error?.message,
      e.data?.message,
      e.message,
      e.response?.statusText
    ) ?? undefined
  );
};

const isAbortError = (err: unknown): boolean => {
  if (!isObject(err)) return false;
  const e = err as AnyRecord;
  return (
    e.name === "AbortError" ||
    e?.cause?.name === "AbortError" ||
    typeof e.code === "string"
  ) && /abort/i.test(String(e.name ?? e.code ?? ""));
};

const isTimeoutish = (msg: string): boolean => /timeout|timed\s*out|etimedout|econnaborted/i.test(msg);
const isNetworkish = (msg: string): boolean =>
  /network\s*error|failed to fetch|typeerror\s*:\s*failed/i.test(msg);

/**
 * Parses a caught error (from an API or internal service) and returns
 * a user-friendly message suitable for display in UI toasts or logs.
 */
export function getApiErrorMessage(error: unknown): string {
  try {
    // Fast paths
    if (isAbortError(error)) {
      return "Request was cancelled.";
    }

    const status = toStatus(error);
    const rawMessage = toMessage(error) || (error instanceof Error ? error.message : "");

    // Classify by HTTP status if present
    if (typeof status === "number") {
      if (status === 401 || status === 403) {
        return "Authentication failed or permission denied. Please verify your credentials.";
      }
      if (status === 404) {
        return "The requested resource was not found.";
      }
      if (status === 408) {
        return "The request timed out. Please try again.";
      }
      if (status === 413) {
        return "The upload is too large. Please reduce the file size and try again.";
      }
      if (status === 422) {
        // Try to surface validation hints if present
        const details =
          (isObject(error) &&
            (error as AnyRecord).response?.data &&
            JSON.stringify((error as AnyRecord).response.data.errors || (error as AnyRecord).response.data.detail || "")) ||
          "";
        return details && details !== '""'
          ? `Validation error. Details: ${details}`
          : "Validation error. Please check your input and try again.";
      }
      if (status === 429) {
        return "Too many requests. You’ve hit a rate limit. Please wait a bit and try again.";
      }
      if (status >= 500) {
        return "Server error. Please try again in a moment.";
      }
    }

    // Message-based classification
    if (rawMessage) {
      if (isTimeoutish(rawMessage)) {
        return "The request timed out. Please try again.";
      }
      if (isNetworkish(rawMessage)) {
        return "Network issue detected. Please check your connection and retry.";
      }
      if (/quota|rate\s*limit|resource[_\s-]*exhausted/i.test(rawMessage)) {
        return "Too many requests. You’ve hit a rate limit. Please wait a bit and try again.";
      }
      if (/unauthorized|forbidden|permission/i.test(rawMessage)) {
        return "Authentication failed or permission denied. Please verify your credentials.";
      }
      // Fallthrough to raw, trimmed message
      const trimmed = rawMessage.trim();
      if (trimmed) return trimmed;
    }

    // Generic fallbacks
    if (typeof error === "string" && error.trim()) return error.trim();
    if (error instanceof Error && error.message.trim()) return error.message.trim();

    return "An unknown error occurred. Please check the console for details.";
  } catch {
    return "Error parsing failure. See logs for diagnostics.";
  }
}

/**
 * Wraps async API calls and ensures a consistent error message return.
 * Useful for try/catch simplification in UI event handlers.
 */
export async function safeApiCall<T>(
  fn: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: getApiErrorMessage(err) };
  }
}
