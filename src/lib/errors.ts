/**
 * Decode an unknown throwable into a display message at the catch boundary.
 * Only Error instances carry a message contract; anything else falls back.
 */
export function errorMessage(cause: unknown, fallback = "Request failed"): string {
  return cause instanceof Error ? cause.message : fallback
}
