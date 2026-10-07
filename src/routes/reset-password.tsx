import { createFileRoute, Link } from "@tanstack/react-router"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { PasswordInput } from "#/components/ui/password-input"
import { authApi } from "#/lib/api"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPassword,
})

function ResetPassword() {
  const search = Route.useSearch()
  const [token, setToken] = React.useState(search.token ?? "")
  const [password, setPassword] = React.useState("")
  const [msg, setMsg] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (search.token) setToken(search.token)
  }, [search.token])

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      await authApi.reset(token.trim(), password)
      setMsg("Password reset — you can now sign in.")
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-110 px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Label>Reset token</Label>
            <Input
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste token from email/logs"
            />
            <Label>New password (min 8)</Label>
            <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            {msg ? (
              <p className="rounded-md bg-success-50 p-3 text-sm text-success-700">
                {msg}{" "}
                <Link to="/auth/signin" className="font-semibold underline">
                  Sign in
                </Link>
              </p>
            ) : null}
            {err ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{err}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
