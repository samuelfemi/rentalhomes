import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, Building2, ChevronLeft, ChevronRight, MapPin, Search, ShieldCheck } from "lucide-react"
import * as React from "react"
import { ListingCard, ListingSkeleton } from "#/components/listing/card"
import { ListingFilters as Filters, type FilterValues } from "#/components/listing/filters"
import { Button } from "#/components/ui/button"
import { type ListingFilters, listingsApi } from "#/lib/api"
import { errorMessage } from "#/lib/errors"

export const Route = createFileRoute("/")({ component: Home })

function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}

function Home() {
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<FilterValues>({
    search: "",
    status: "",
    furnished: "",
    minPrice: "",
    maxPrice: "",
    rooms: "",
    minRooms: "",
  })

  const debouncedSearch = useDebounced(filters.search, 400)

  const apiFilters: ListingFilters = React.useMemo(
    () => ({
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      furnished: filters.furnished ? filters.furnished === "true" : undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      rooms: filters.rooms ? Number(filters.rooms) : undefined,
      minRooms: filters.minRooms ? Number(filters.minRooms) : undefined,
    }),
    [
      page,
      debouncedSearch,
      filters.status,
      filters.furnished,
      filters.minPrice,
      filters.maxPrice,
      filters.rooms,
      filters.minRooms,
    ],
  )

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["listings", apiFilters],
    queryFn: () => listingsApi.list(apiFilters),
    placeholderData: (prev) => prev,
  })

  // reset page when filters change
  const filtersKey = `${debouncedSearch}|${filters.status}|${filters.furnished}|${filters.minPrice}|${filters.maxPrice}|${filters.rooms}|${filters.minRooms}`
  React.useEffect(() => {
    setPage(1)
  }, [filtersKey])

  return (
    <div className="mx-auto w-full max-w-320 px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-warning-50" />
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-hero lg:p-10">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
              <span className="size-2 rounded-full bg-success-500" />
              Verified listings across Nigeria
            </span>
            <h1 className="text-balance text-3xl font-extrabold leading-none tracking-tight sm:text-5xl">
              Find a home that feels
              <span className="text-primary"> like home.</span>
            </h1>
            <p className="max-w-104 text-sm leading-relaxed text-muted-foreground">
              EazyRent connects you with trusted landlords. Search by neighborhood, price, and preferences — save what
              you love and message directly.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild size="lg">
                <a href="#listings">
                  Browse homes <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/listings/new">List your property</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 pt-2 text-sm">
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="flex size-8 items-center justify-center rounded-full bg-success-50 text-success-700">
                  <ShieldCheck className="size-4" />
                </span>
                Verified landlords
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="size-4" />
                </span>
                Direct contact, no middleman
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 -rotate-1 rounded-2xl bg-primary/5" />
            <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="grid grid-cols-3 gap-px bg-border">
                {[
                  { k: "Available", v: "New" },
                  { k: "Lagos", v: "Popular" },
                  { k: "Furnished", v: "Filter" },
                ].map((c) => (
                  <div key={c.k} className="bg-white px-3 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{c.k}</p>
                    <p className="text-xs font-bold">{c.v}</p>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 rounded-xl border bg-muted/50 px-3 py-2.5 text-sm">
                  <Search className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">3-bed in Yaba, Lagos</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-3 rounded-xl border p-3">
                      <div className="size-14 shrink-0 rounded-lg bg-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">Sunset Apartments {i}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3" /> Yaba, Lagos
                        </p>
                        <p className="text-xs font-bold">₦2,500,000 / year</p>
                      </div>
                      <span className="h-fit rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">
                        Available
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div id="listings" className="mt-6 scroll-mt-20">
        <Filters
          values={filters}
          onChange={(p) => setFilters((s) => ({ ...s, ...p }))}
          onReset={() =>
            setFilters({
              search: "",
              status: "",
              furnished: "",
              minPrice: "",
              maxPrice: "",
              rooms: "",
              minRooms: "",
            })
          }
          total={data?.total}
        />
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">Could not load listings</p>
            <p className="text-muted-foreground">{errorMessage(error, "Could not load listings")}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Make sure the Go API is running on http://localhost:8080 (task dev) and Postgres is reachable.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ListingSkeleton key={i} />)
            : (data?.data ?? []).map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>

        {!isLoading && (data?.data.length ?? 0) === 0 && !isError ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No homes match your search</h3>
              <p className="text-sm text-muted-foreground">
                Try widening your price range, clearing filters, or searching a different area.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters({
                    search: "",
                    status: "",
                    furnished: "",
                    minPrice: "",
                    maxPrice: "",
                    rooms: "",
                    minRooms: "",
                  })
                }
              >
                Clear all filters
              </Button>
            </div>
          </div>
        ) : null}

        {/* Pagination */}
        {data && data.total_pages > 1 ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{data.page}</span> of {data.total_pages} •{" "}
              {data.total} homes
              {isFetching ? <span className="ml-2 text-xs">Updating…</span> : null}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
