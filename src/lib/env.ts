/**
 * Client/server boundary: true when DOM globals exist. TanStack Start may
 * render on the server, where a bare `window` reference throws — branch on
 * this instead of narrowing globals at every use site.
 */
export const isBrowser = "window" in globalThis

/**
 * Read a Vite-exposed env var. Undeclared keys are undefined at runtime,
 * so decode to a domain string here instead of narrowing at every use site.
 */
export function readEnv(name: string): string | undefined {
  const value: unknown = import.meta.env[name]
  if (value === undefined || value === null) return undefined
  return String(value)
}
