import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { errorMessage } from "#/lib/errors";
import { ListingCard, ListingSkeleton } from "#/components/listing/card";
import { Button } from "#/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/my-listings")({ component: MyListings });

function MyListings() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const isVerified = !!user?.email_verified;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.my(1, 20),
    enabled: isAuthenticated && isVerified,
  });

  if (authLoading) return <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">Loading…</div>;
  if (isAuthenticated && !isVerified) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
          <h1 className="text-xl font-bold">Verify your email to manage listings</h1>
          <p className="text-sm text-muted-foreground">You can browse homes. Verify to create and track your listings.</p>
          <Button asChild className="mt-4">
            <Link to="/auth/verify">Verify email</Link>
          </Button>
          {isError ? <div className="mt-3 text-sm text-destructive">{errorMessage(error)}</div> : null}
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border bg-white p-10 text-center">
          <h1 className="text-xl font-bold">Sign in to manage listings</h1>
          <p className="text-sm text-muted-foreground">Landlords can create, edit and track their homes.</p>
          <Button asChild className="mt-4">
            <Link to="/auth/signin">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
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

      {isError ? <div className="mt-6 rounded-xl border bg-destructive/5 p-4 text-sm text-destructive">{errorMessage(error)}</div> : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <ListingSkeleton key={i} />) : (data?.data ?? []).map((l) => <ListingCard key={l.id} listing={l} />)}
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
  );
}
