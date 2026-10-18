import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import {
  type AuthTokens,
  authApi,
  clearTokens,
  getStoredTokens,
  setTokens,
  subscribeToTokenChanges,
  type User,
} from "./api"
import { isBrowser } from "./env"

type AuthState = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (tokens: AuthTokens) => void
  logout: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()

  // False during SSR and the hydration pass (so client render matches the
  // server render), then reflects localStorage. Re-syncs whenever tokens are
  // written or cleared anywhere — login, logout, or a failed token refresh —
  // so the auth UI can never go stale after the fact.
  const [hasToken, setHasToken] = React.useState(false)

  React.useEffect(() => {
    if (!isBrowser) return
    const sync = () => setHasToken(getStoredTokens().access !== null)
    sync()
    return subscribeToTokenChanges(sync)
  }, [])

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  })

  // Token loss (logout or failed refresh) must drop the cached user, so the
  // UI cannot keep rendering a session that no longer exists.
  React.useEffect(() => {
    if (!hasToken) qc.removeQueries({ queryKey: ["me"] })
  }, [hasToken, qc])

  const login = React.useCallback(
    (tokens: AuthTokens) => {
      setTokens(tokens) // notifies subscribers → hasToken flips → query enables
      qc.invalidateQueries({ queryKey: ["me"] })
    },
    [qc],
  )

  const logout = React.useCallback(async () => {
    try {
      await authApi.signout()
    } finally {
      clearTokens() // notifies subscribers → hasToken flips false
      qc.clear() // drop every cached query alongside the session
    }
  }, [qc])

  const refreshUser = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["me"] })
  }, [qc])

  const value = React.useMemo<AuthState>(
    () => ({
      user: hasToken ? (user ?? null) : null,
      isLoading: hasToken && isLoading,
      isAuthenticated: hasToken && !!user,
      login,
      logout,
      refreshUser,
    }),
    [hasToken, user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
