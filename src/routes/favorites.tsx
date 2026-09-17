import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { errorMessage } from "#/lib/errors";
import { ListingCard, ListingSkeleton } from "#/components/listing/card";
import { Button } from "#/components/ui/button";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({ component: FavoritesPage });

function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isVerified = !!user?.email_verified;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesApi.list(1, 20),
    enabled: isAuthenticated && isVerified,
  });

  if (authLoading) return <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">Loading…</div>;

  if (isAuthenticated && !isVerified) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
          <h1 className="text-xl font-bold">Verify your email to use favorites</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">You can browse listings now. Verify your email (check inbox or API logs for the link) to save favorites.</p>
          <Button asChild className="mt-4">
            <Link to="/auth/verify">Verify email</Link>
          </Button>
          {isError ? <p className="mt-3 text-sm text-destructive">{errorMessage(error)}</p> : null}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border bg-white p-10 text-center">
          <Heart className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-bold">Sign in to see favorites</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Save homes you love and revisit them here.</p>
          <Button asChild className="mt-4">
            <Link to="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
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
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />) : (data?.data ?? []).map((l) => <ListingCard key={l.id} listing={l} />)}
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
  );
}
