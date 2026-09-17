import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi, formatPrice, listingsApi, type ListingStatus } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { errorMessage } from "#/lib/errors";
import { Button } from "#/components/ui/button";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { ArrowLeft, BedDouble, Heart, MapPin, Phone, Sofa, Trash2, Pencil } from "lucide-react";
import { useToast } from "#/components/ui/toast";
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogFooter } from "#/components/ui/dialog";
import * as React from "react";

export const Route = createFileRoute("/listings/$id")({ component: DetailPage });

function DetailPage() {
  const { id } = Route.useParams();
  const { isAuthenticated, user } = useAuth();
  const isVerified = !!user?.email_verified;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [active, setActive] = React.useState(0);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.get(id),
  });

  const matches = useRouterState({ select: (s) => s.matches });
  const isEditing = matches.some((m) => m.routeId === "/listings/$id/edit");

  const favAdd = useMutation({
    mutationFn: () => favoritesApi.add(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast("Saved to favorites", { description: "Find it anytime under Favorites." });
    },
    onError: (e: Error) => toast("Could not save", { description: e.message, variant: "error" }),
  });
  const favRemove = useMutation({
    mutationFn: () => favoritesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast("Removed from favorites");
    },
    onError: (e: Error) => toast("Could not remove", { description: e.message, variant: "error" }),
  });

  const del = useMutation({
    mutationFn: () => listingsApi.remove(id),
    onSuccess: () => {
      window.location.href = "/my-listings";
    },
    onError: (e: Error) => {
      setConfirmDelete(false);
      toast("Could not delete", { description: e.message, variant: "error" });
    },
  });

  // Rendered after ALL hooks: the edit child needs the parent outlet,
  // and returning early above would change the hook count (React error).
  if (isEditing) return <Outlet />;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
          <p className="font-semibold text-destructive">Listing not found</p>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Check the URL or try browsing."}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/">Browse homes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { listing, media, landlord_name, landlord_phone } = data;
  const isOwner = isAuthenticated && user?.id === listing.landlord_id;
  const cover = media[active]?.url ?? listing.cover_image ?? null;
  type StatusNames = { [status in ListingStatus]: string };
  const statusMap: StatusNames = { avaiable: "Available", rented: "Rented", inative: "Inactive" };
  const favErrorMessage = errorMessage(favAdd.error ?? favRemove.error);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
        <ArrowLeft className="size-4" /> Back to listings
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Media */}
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="relative aspect-[16/10] bg-muted">
            {cover ? (
              <img src={cover} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
            )}
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge variant={listing.status === "avaiable" ? "success" : "secondary"} className="shadow">
                {statusMap[listing.status] ?? listing.status}
              </Badge>
              {listing.furnished ? <Badge className="bg-white text-foreground shadow">Furnished</Badge> : null}
            </div>
          </div>
          {media.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto p-3">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? "border-primary" : "border-transparent"}`}
                >
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
          {media.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">No media attached. Owner can add images from My listings.</p>
          ) : null}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold leading-tight">{listing.title}</h1>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {listing.address}
                  </p>
                </div>
                {isAuthenticated && isVerified ? (
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Favorite"
                    onClick={() => {
                      if (favAdd.isPending || favRemove.isPending) return;
                      favAdd.mutate();
                    }}
                    title="Save to favorites"
                  >
                    <Heart className="size-4" />
                  </Button>
                ) : isAuthenticated && !isVerified ? (
                  <Button size="icon" variant="outline" disabled title="Verify email to favorite">
                    <Heart className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                  <BedDouble className="size-3.5" /> {listing.rooms ?? 0} beds
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                  <Sofa className="size-3.5" /> {listing.furnished ? "Furnished" : "Unfurnished"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1">
                  <Heart className="size-3.5" /> {listing.favorite_count} saves
                </span>
              </div>

              <div className="mt-6 rounded-xl bg-primary px-5 py-4 text-primary-foreground">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Price</p>
                <p className="text-2xl font-extrabold">{formatPrice(listing.price)}</p>
                <p className="text-xs opacity-80">per year • negotiable with landlord</p>
              </div>

              {isOwner ? (
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/listings/$id/edit" params={{ id }}>
                      <Pencil className="size-4" /> Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-1"
                    onClick={() => setConfirmDelete(true)}
                    disabled={del.isPending}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                  <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                    <DialogPopup>
                      <DialogTitle>Delete this listing?</DialogTitle>
                      <DialogDescription>
                        “{listing.title}” and all its photos will be permanently removed. This cannot be undone.
                      </DialogDescription>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={del.isPending}>
                          Keep it
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => del.mutate()}
                          disabled={del.isPending}
                        >
                          {del.isPending ? "Deleting…" : "Yes, delete"}
                        </Button>
                      </DialogFooter>
                    </DialogPopup>
                  </Dialog>
                </div>
              ) : null}

              {isAuthenticated && !isVerified ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Landlord contact locked</p>
                  <p className="mt-1 text-sm text-amber-900">Verify your email to see landlord phone and name.</p>
                  <Link to="/auth/verify" className="text-sm font-semibold text-primary hover:underline">Verify email</Link>
                </div>
              ) : landlord_name || landlord_phone ? (
                <div className="mt-4 rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Landlord</p>
                  <p className="mt-1 font-semibold">{landlord_name ?? "Landlord"}</p>
                  {landlord_phone ? (
                    <a href={`tel:${landlord_phone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                      <Phone className="size-4" /> {landlord_phone}
                    </a>
                  ) : null}
                </div>
              ) : null}

              {!isAuthenticated ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link to="/auth/signin" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to save favorites or contact landlord.
                </p>
              ) : null}

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated || !isVerified) return;
                    favAdd.mutate();
                  }}
                  disabled={favAdd.isPending || (isAuthenticated && !isVerified)}
                  title={isAuthenticated && !isVerified ? "Verify email to favorite" : undefined}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated || !isVerified) return;
                    favRemove.mutate();
                  }}
                  disabled={favRemove.isPending || (isAuthenticated && !isVerified)}
                >
                  Unsave
                </Button>
                {(favAdd.isSuccess || favRemove.isSuccess) && <span className="text-xs text-emerald-600 self-center">Updated</span>}
                {(favAdd.isError || favRemove.isError) && (
                  <span className="text-xs text-destructive self-center">{favErrorMessage}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-bold">About this home</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">{listing.latitude.toFixed(4)}, {listing.longitude.toFixed(4)}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Open in Maps
                  </a>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Listed</p>
                  <p className="font-medium">{new Date(listing.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
                  <p className="text-xs text-muted-foreground">Updated {new Date(listing.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
