import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { type AuthTokens, authApi, clearTokens, getStoredTokens, setTokens, type User } from "./api"
import { isBrowser } from "./env"

type AuthState = {
  user: User | null | undefined
  isLoading: boolean
  isAuthenticated: boolean
  login: (tokens: AuthTokens) => void
  logout: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const hasToken = isBrowser ? getStoredTokens().access !== null : false

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  })

  const login = React.useCallback(
    (tokens: AuthTokens) => {
      setTokens(tokens)
      qc.invalidateQueries({ queryKey: ["me"] })
    },
    [qc],
  )

  const logout = React.useCallback(async () => {
    try {
      await authApi.signout()
    } finally {
      clearTokens()
      qc.setQueryData(["me"], null)
      qc.clear()
    }
  }, [qc])

  const refreshUser = React.useCallback(() => {
    qc.invalidateQueries({ queryKey: ["me"] })
  }, [qc])

  const value: AuthState = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  // when no token, isLoading is false and user is null — normalize
  if (!hasToken) {
    value.isLoading = false
    value.isAuthenticated = false
    value.user = null
  } else if (isLoading) {
    value.user = undefined
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
