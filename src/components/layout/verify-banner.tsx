import { Link } from "@tanstack/react-router"
import { MailWarning } from "lucide-react"
import { useAuth } from "#/lib/auth"

export function VerifyBanner() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (!isAuthenticated || !user) return null
  if (user.email_verified) return null

  return (
    <div className="border-b bg-warning-50">
      <div className="mx-auto flex max-w-320 flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="inline-flex items-center gap-2 font-medium text-warning-900">
          <MailWarning className="size-4 shrink-0" />
          Verify your email to unlock everything — you can browse listings, but favorites, listing and contact details
          require verification.
        </span>
        <span className="flex items-center gap-3 text-xs">
          <span className="hidden text-warning-800 sm:inline">Check inbox ({user.email}) or API logs.</span>
          <Link
            to="/auth/verify"
            className="inline-flex h-7 items-center rounded-md bg-warning-900 px-3 font-semibold text-white hover:bg-warning-800"
          >
            Verify
          </Link>
        </span>
      </div>
    </div>
  )
}
