import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Heart } from "lucide-react"
import { AccountGate } from "#/components/auth/account-gate"
import { ListingCard, ListingSkeleton, SKELETON_SLOTS } from "#/components/listing/card"
import { Button } from "#/components/ui/button"
import { favoritesApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { requireAuth } from "#/lib/auth-guard"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/favorites")({
  beforeLoad: requireAuth,
  component: FavoritesPage,
})

function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const isVerified = !!user?.email_verified

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["favorites"],
    // Limit matches the detail page's favorites cache so one entry serves both.
    queryFn: () => favoritesApi.list(1, 100),
    enabled: isAuthenticated && isVerified,
  })

  if (authLoading) return <div className="mx-auto max-w-320 px-4 py-10 sm:px-6">Loading…</div>

  if (isAuthenticated && !isVerified) {
    return (
      <AccountGate
        variant="unverified"
        title="Verify your email to use favorites"
        description="You can browse listings now. Verify your email (check inbox or API logs for the link) to save favorites."
      >
        {isError ? <p className="mt-3 text-sm text-destructive">{errorMessage(error)}</p> : null}
      </AccountGate>
    )
  }

  if (!isAuthenticated) {
    return (
      <AccountGate
        variant="signed-out"
        title="Sign in to see favorites"
        description="Save homes you love and revisit them here."
        icon={<Heart className="mx-auto size-10 text-muted-foreground" />}
      />
    )
  }

  return (
    <div className="mx-auto max-w-320 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Favorites</h1>
        {data ? <span className="text-sm text-muted-foreground">{data.total} saved</span> : null}
      </div>

      {isError ? (
        <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
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
          <p className="font-semibold">No favorites yet</p>
          <p className="text-sm text-muted-foreground">Tap the heart on any listing to save it.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/">Browse homes</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
