import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, Building2, ChevronLeft, ChevronRight, MapPin, Search, ShieldCheck } from "lucide-react"
import * as React from "react"
import { ListingCard, ListingSkeleton, SKELETON_SLOTS } from "#/components/listing/card"
import { ListingFilters as Filters, type FilterValues } from "#/components/listing/filters"
import { Button } from "#/components/ui/button"
import { type ListingFilters, listingsApi } from "#/lib/api"
import { errorMessage } from "#/lib/errors"
import { type RawSearch, rawDigits, rawNumber, rawString } from "#/lib/search-params"

export const Route = createFileRoute("/")({
  validateSearch: validateHomeSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    const filters = buildListingsFilters(deps.search)
    // Serves SSR and intent preloads from (and warms) the query cache. A
    // failure must not kill the page — the component falls back to client
    // fetching with its inline error card.
    return context.queryClient
      .ensureQueryData({ queryKey: ["listings", filters], queryFn: () => listingsApi.list(filters) })
      .catch(() => undefined)
  },
  component: Home,
})

export type HomeSearch = {
  page?: number
  q?: string
  status?: string
  furnished?: string
  minPrice?: string
  maxPrice?: string
  rooms?: string
  minRooms?: string
}

const STATUSES: readonly string[] = ["avaiable", "rented", "inative"]

/**
 * Search params are the single source of truth for the browse page: filters
 * and pagination survive refreshes, are shareable, and feed the loader.
 * Invalid values are dropped rather than trusted.
 */
function validateHomeSearch(search: RawSearch): HomeSearch {
  const result: HomeSearch = {}

  const page = rawNumber(search.page)
  if (page !== undefined && Number.isInteger(page) && page > 1 && page <= 10_000) result.page = page

  const q = rawString(search.q)
  if (q) result.q = q.trim().slice(0, 200)

  const status = rawString(search.status)
  if (status && STATUSES.includes(status)) result.status = status

  const furnished = rawString(search.furnished)
  if (furnished === "true" || furnished === "false") result.furnished = furnished

  // Numeric inputs: digits only, reject absurd lengths.
  const minPrice = rawDigits(search.minPrice)
  if (minPrice) result.minPrice = minPrice

  const maxPrice = rawDigits(search.maxPrice)
  if (maxPrice) result.maxPrice = maxPrice

  const rooms = rawDigits(search.rooms)
  if (rooms) result.rooms = rooms

  const minRooms = rawDigits(search.minRooms)
  if (minRooms) result.minRooms = minRooms

  return result
}

/** Map URL search params to the API filter contract. Shared by loader + view. */
export function buildListingsFilters(search: HomeSearch): ListingFilters {
  return {
    page: search.page ?? 1,
    limit: 12,
    search: search.q || undefined,
    status: search.status || undefined,
    furnished: search.furnished ? search.furnished === "true" : undefined,
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    rooms: search.rooms ? Number(search.rooms) : undefined,
    minRooms: search.minRooms ? Number(search.minRooms) : undefined,
  }
}

function Home() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const loaderData = Route.useLoaderData()
  const page = search.page ?? 1

  // The input keeps local state so typing is instant; it is committed to the
  // URL (and therefore the query + loader) on a debounce.
  const [searchInput, setSearchInput] = React.useState(search.q ?? "")

  // URL wins when the query changes externally (reset, back/forward).
  React.useEffect(() => {
    setSearchInput(search.q ?? "")
  }, [search.q])

  React.useEffect(() => {
    if (searchInput === (search.q ?? "")) return
    const id = window.setTimeout(() => {
      void navigate({
        search: (prev) => ({ ...prev, q: searchInput || undefined, page: undefined }),
        replace: true,
      })
    }, 400)
    return () => window.clearTimeout(id)
  }, [searchInput, search.q, navigate])

  const apiFilters = React.useMemo(() => buildListingsFilters(search), [search])

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["listings", apiFilters],
    queryFn: () => listingsApi.list(apiFilters),
    placeholderData: (prev) => prev,
    initialData: loaderData,
  })

  const setFilters = (patch: Partial<FilterValues>) => {
    const { search: nextSearch, ...rest } = patch
    if (nextSearch !== undefined) {
      setSearchInput(nextSearch) // committed to the URL by the debounce effect
      return
    }
    if (Object.keys(rest).length === 0) return
    // One atomic update: new filters always land on page 1 (no wasted
    // request with the stale page number).
    void navigate({ search: (prev) => ({ ...prev, ...rest, page: undefined }), replace: true })
  }

  const resetFilters = () => {
    setSearchInput("")
    void navigate({ search: {}, replace: true })
  }

  const goToPage = (next: number) => {
    void navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) })
    window.scrollTo({ top: 0 })
  }

  const values: FilterValues = {
    search: searchInput,
    status: search.status ?? "",
    furnished: search.furnished ?? "",
    minPrice: search.minPrice ?? "",
    maxPrice: search.maxPrice ?? "",
    rooms: search.rooms ?? "",
    minRooms: search.minRooms ?? "",
  }

  return (
    <div className="mx-auto w-full max-w-320 px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-hero lg:p-10">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
              <span className="size-2 rounded-full bg-primary" />
              Verified listings across Nigeria
            </span>
            <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
              Find a home that feels
              <span className="text-primary"> like home.</span>
            </h1>
            <p className="max-w-104 text-pretty text-sm leading-relaxed text-muted-foreground">
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
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <ShieldCheck className="size-4" />
                </span>
                Verified landlords
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
                  <Building2 className="size-4" />
                </span>
                Direct contact, no middleman
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="grid grid-cols-3 gap-px bg-border">
                {[
                  { k: "Available", v: "New" },
                  { k: "Lagos", v: "Popular" },
                  { k: "Furnished", v: "Filter" },
                ].map((c) => (
                  <div key={c.k} className="bg-white px-3 py-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{c.k}</p>
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
                        <p className="text-xs font-bold tabular-nums">₦2,500,000 / year</p>
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
        <Filters values={values} onChange={setFilters} onReset={resetFilters} total={data?.total} />
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm">
            <p className="font-semibold text-destructive">Could not load listings</p>
            <p className="text-muted-foreground">{errorMessage(error, "Could not load listings")}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? SKELETON_SLOTS.map((slot) => <ListingSkeleton key={slot} />)
            : (data?.data ?? []).map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>

        {!isLoading && (data?.data.length ?? 0) === 0 && !isError ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-balance text-lg font-bold">No homes match your search</h3>
              <p className="text-pretty text-sm text-muted-foreground">
                Try widening your price range, clearing filters, or searching a different area.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        ) : null}

        {/* Pagination */}
        {data && data.total_pages > 1 ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t pt-6">
            <p className="text-sm tabular-nums text-muted-foreground">
              Page <span className="font-semibold text-foreground">{data.page}</span> of {data.total_pages} •{" "}
              {data.total} homes
              {isFetching ? <span className="ml-2 text-xs">Updating…</span> : null}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => goToPage(page + 1)}
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
