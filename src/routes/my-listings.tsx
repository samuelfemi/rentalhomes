import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { AccountGate } from "#/components/auth/account-gate"
import { ListingCard, ListingSkeleton, SKELETON_SLOTS } from "#/components/listing/card"
import { Button } from "#/components/ui/button"
import { listingsApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { requireAuth } from "#/lib/auth-guard"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/my-listings")({
  beforeLoad: requireAuth,
  component: MyListings,
})

function MyListings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const isVerified = !!user?.email_verified
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.my(1, 20),
    enabled: isAuthenticated && isVerified,
  })

  if (authLoading) return <div className="mx-auto max-w-320 px-4 py-10 sm:px-6">Loading…</div>
  if (isAuthenticated && !isVerified) {
    return (
      <AccountGate
        variant="unverified"
        title="Verify your email to manage listings"
        description="You can browse homes. Verify to create and track your listings."
      >
        {isError ? <div className="mt-3 text-sm text-destructive">{errorMessage(error)}</div> : null}
      </AccountGate>
    )
  }
  if (!isAuthenticated) {
    return (
      <AccountGate
        variant="signed-out"
        title="Sign in to manage listings"
        description="Landlords can create, edit and track their homes."
      />
    )
  }

  return (
    <div className="mx-auto max-w-320 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">My listings</h1>
          <p className="text-sm text-muted-foreground">{data ? `${data.total} homes` : "Your properties"}</p>
        </div>
        <Button asChild>
          <Link to="/listings/new">
            <Plus className="size-4" /> New listing
          </Link>
        </Button>
      </div>

      {isError ? (
        <div className="mt-6 rounded-xl border bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage(error)}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? SKELETON_SLOTS.slice(0, 4).map((slot) => <ListingSkeleton key={slot} />)
          : (data?.data ?? []).map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>

      {!isLoading && (data?.data.length ?? 0) === 0 && !isError ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-white p-10 text-center">
          <p className="font-semibold">You haven&apos;t listed a home yet</p>
          <p className="text-sm text-muted-foreground">Create your first listing — it takes under 2 minutes.</p>
          <Button asChild className="mt-4">
            <Link to="/listings/new">Create listing</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
