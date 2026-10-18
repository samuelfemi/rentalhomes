import { QueryClient } from "@tanstack/react-query"
import { isBrowser } from "#/lib/env"

let browserQueryClient: QueryClient | undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

/**
 * The single QueryClient shared by route loaders (via router context) and
 * components (via QueryClientProvider in the root shell). On the server a
 * fresh client is created per request; on the browser a singleton survives
 * navigation.
 */
export function getQueryClient() {
  if (!isBrowser) {
    // Server: always create a fresh client per request
    return makeQueryClient()
  }
  // Client: reuse a singleton so cache survives navigation
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}
