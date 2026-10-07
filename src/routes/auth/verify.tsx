import { createFileRoute, Link } from "@tanstack/react-router"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { authApi } from "#/lib/api"

export const Route = createFileRoute("/auth/verify")({ component: Verify })

function Verify() {
  const [state, setState] = React.useState<"idle" | "loading" | "ok" | "error">("idle")
  const [msg, setMsg] = React.useState("")
  const fetchedRef = React.useRef(false)

  React.useEffect(() => {
    const t = (new URLSearchParams(window.location.search).get("token") || "").trim()
    if (!t) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    setState("loading")
    authApi
      .verify(t)
      .then(() => {
        setState("ok")
        setMsg("Email verified. You can now sign in.")
      })
      .catch((e: Error) => {
        const m = e.message || "Verification failed"
        const hint = m.toLowerCase().includes("invalid verification token")
          ? `${m} — if you already verified, try signing in.`
          : m
        setState("error")
        setMsg(hint)
      })
  }, [])

  return (
    <div className="mx-auto max-w-120 px-4 py-16 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state === "loading" ? <p className="text-sm text-muted-foreground">Verifying…</p> : null}
            {state === "ok" ? <p className="rounded-md bg-success-50 p-3 text-sm text-success-700">{msg}</p> : null}
            {state === "error" ? (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{msg}</p>
            ) : null}
            {state === "idle" ? (
              <p className="text-sm text-muted-foreground">No token in URL. Check your email or API logs.</p>
            ) : null}
            <Button asChild>
              <Link to="/auth/signin">Go to sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
