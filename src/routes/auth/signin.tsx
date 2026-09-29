import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { PasswordInput } from "#/components/ui/password-input"
import { authApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/auth/signin")({ component: SignIn })

function SignIn() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const tokens = await authApi.signin({ email: email.trim(), password })
      login(tokens)
      nav({ to: "/" })
    } catch (err) {
      console.error("[signin] failed:", err)
      setError(errorMessage(err, "Sign in failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-240px)] max-w-[440px] items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to save favorites and manage listings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <div className="flex justify-between text-sm">
              <Link to="/auth/signup" className="font-medium text-primary hover:underline">
                Create account
              </Link>
              <Link to="/auth/forgot" className="text-muted-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
