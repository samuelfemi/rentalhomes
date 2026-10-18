import { createFileRoute, redirect } from "@tanstack/react-router"
import { type RawSearch, rawString } from "#/lib/search-params"

export type ResetTokenSearch = { token?: string }

/**
 * /auth/reset used to be a duplicate of /reset-password. Emails may still
 * point at either path, so this route forwards to the canonical one while
 * preserving the ?token= parameter.
 */
export const Route = createFileRoute("/auth/reset")({
  validateSearch: (search: RawSearch): ResetTokenSearch => {
    const result: ResetTokenSearch = {}
    const token = rawString(search.token)
    if (token) result.token = token
    return result
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/reset-password",
      search: search.token ? { token: search.token } : {},
      replace: true,
    })
  },
})
