import { createFileRoute, Link } from "@tanstack/react-router"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { authApi } from "#/lib/api"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/auth/forgot")({ component: Forgot })

function Forgot() {
  const [email, setEmail] = React.useState("")
  const [msg, setMsg] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    setMsg(null)
    try {
      await authApi.forgot(email.trim())
      setMsg("If the email is registered, a reset link was sent (check API logs).")
    } catch (e) {
      setErr(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[440px] px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We&apos;ll send a reset link if the email exists</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Label>Email</Label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {msg ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p> : null}
            {err ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{err}</p> : null}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
            <Link to="/auth/signin" className="block text-center text-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
