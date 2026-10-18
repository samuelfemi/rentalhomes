import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { PasswordInput } from "#/components/ui/password-input"
import { authApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { type AuthRedirectSearch, safeInternalPath } from "#/lib/auth-guard"
import { errorMessage } from "#/lib/errors"
import { type RawSearch, rawString } from "#/lib/search-params"

export const Route = createFileRoute("/auth/signup")({
  validateSearch: (search: RawSearch): AuthRedirectSearch => {
    const result: AuthRedirectSearch = {}
    const redirect = rawString(search.redirect)
    if (redirect) result.redirect = redirect
    return result
  },
  component: SignUp,
})

function SignUp() {
  const search = Route.useSearch()
  const nav = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = React.useState({
    email: "",
    password: "",
    phone: "",
    full_name: "",
  })
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const tokens = await authApi.signup({
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        full_name: form.full_name.trim(),
      })
      login(tokens)
      setInfo("Account created. Check your email to verify (link also logged to API console).")
      setTimeout(() => void nav({ href: safeInternalPath(search.redirect) }), 900)
    } catch (err) {
      setError(errorMessage(err, "Sign up failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-auth max-w-120 items-center px-4 py-10 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle size="xl">Create account</CardTitle>
          <CardDescription>Join EazyRent — list or find your next home</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Femi Ade"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-phone">Phone</Label>
              <Input
                id="signup-phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="080..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password (min 8)</Label>
              <PasswordInput
                id="signup-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            {info ? <p className="rounded-md bg-success-50 p-3 text-sm text-success-700">{info}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth/signin" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
