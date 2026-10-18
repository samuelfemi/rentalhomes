import { redirect } from "@tanstack/react-router"
import { getStoredTokens } from "./api"
import { isBrowser } from "./env"

/**
 * beforeLoad guard for pages that require a signed-in account. Bounces
 * signed-out users to /auth/signin with a ?redirect= param so sign-in can
 * return them to where they were heading.
 *
 * No-op on the server — tokens live in localStorage, invisible to SSR — so
 * direct loads and hard refreshes still render the page's inline fallback
 * cards instead of redirecting.
 */
export function requireAuth(args: { location: { href: string } }) {
  if (!isBrowser) return
  if (getStoredTokens().access) return
  throw redirect({
    to: "/auth/signin",
    search: { redirect: args.location.href },
  })
}

/**
 * Only allow same-site absolute paths as redirect targets ("//evil.com"
 * and absolute URLs would leave the app).
 */
export function safeInternalPath(value: string | undefined, fallback = "/"): string {
  if (value?.startsWith("/") && !value.startsWith("//")) return value
  return fallback
}

/** Search schema shared by the auth pages that honor a ?redirect= target. */
export type AuthRedirectSearch = { redirect?: string }
