import { Link } from "@tanstack/react-router"
import { cn } from "cn"
import { BedDouble, Heart, MapPin, Sofa } from "lucide-react"
import { Badge } from "#/components/ui/badge"
import { formatPrice, type Listing, type ListingStatus } from "#/lib/api"

type StatusBadge = {
  label: string
  variant: "success" | "secondary" | "warning"
}
type StatusLabels = { [status in ListingStatus]: StatusBadge }

const statusLabel: StatusLabels = {
  avaiable: { label: "Available", variant: "success" },
  rented: { label: "Rented", variant: "secondary" },
  inative: { label: "Inactive", variant: "warning" },
}

export function ListingCard({ listing }: { listing: Listing }) {
  const s = statusLabel[listing.status] ?? {
    label: listing.status,
    variant: "secondary" as const,
  }
  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {listing.cover_image ? (
          <img
            src={listing.cover_image}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-103"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted p-6 text-center text-sm text-muted-foreground">
            No image yet
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full shadow">
            <Badge variant={s.variant}>{s.label}</Badge>
          </span>
          {listing.furnished ? (
            <Badge variant="overlay">
              <Sofa className="size-3" /> Furnished
            </Badge>
          ) : null}
        </div>
        {listing.favorite_count > 0 ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Heart className="size-3 fill-white text-white" />
            {listing.favorite_count}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
          <p className="text-lg font-extrabold leading-none text-white">{formatPrice(listing.price)}</p>
          <p className="text-xs font-medium text-white/80">per year</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-bold leading-tight">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="line-clamp-1">{listing.address}</span>
        </p>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{listing.description}</p>

        <div className="mt-auto flex items-center gap-3 pt-2 text-xs font-medium">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
              listing.rooms !== null && listing.rooms > 0 ? "bg-card" : "bg-muted text-muted-foreground",
            )}
          >
            <BedDouble className="size-3.5" />
            {listing.rooms ?? 0} {listing.rooms === 1 ? "bed" : "beds"}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(listing.created_at).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-4/3 animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
