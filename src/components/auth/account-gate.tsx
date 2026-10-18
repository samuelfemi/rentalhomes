import { Link } from "@tanstack/react-router"
import type * as React from "react"
import { Button } from "#/components/ui/button"

/**
 * Shared fallback screens for pages that need a signed-in, verified account.
 * The requireAuth beforeLoad guard redirects signed-out users on client
 * navigations, so the signed-out card only shows on direct loads and SSR.
 */
export function AccountGate({
  variant,
  title,
  description,
  icon,
  children,
}: {
  variant: "signed-out" | "unverified"
  title: string
  description: React.ReactNode
  icon?: React.ReactNode
  children?: React.ReactNode
}) {
  if (variant === "unverified") {
    return (
      <div className="mx-auto max-w-320 px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-10 text-center">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
          <Button asChild className="mt-4">
            <Link to="/auth/verify">Verify email</Link>
          </Button>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-320 px-4 py-16 sm:px-6">
      <div className="rounded-2xl border bg-white p-10 text-center">
        {icon}
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        <Button asChild className="mt-4">
          <Link to="/auth/signin">Sign in</Link>
        </Button>
        {children}
      </div>
    </div>
  )
}
