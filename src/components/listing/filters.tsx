import { Search, SlidersHorizontal, X } from "lucide-react"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Select } from "#/components/ui/select"

export type FilterValues = {
  search: string
  status: string
  furnished: string
  minPrice: string
  maxPrice: string
  rooms: string
  minRooms: string
}

export function ListingFilters({
  values,
  onChange,
  onReset,
  total,
}: {
  values: FilterValues
  onChange: (patch: Partial<FilterValues>) => void
  onReset: () => void
  total?: number
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const hasActive =
    values.status || values.furnished || values.minPrice || values.maxPrice || values.rooms || values.minRooms

  return (
    <div className="rounded-2xl border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, address or description…"
              value={values.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={values.status}
              onChange={(e) => onChange({ status: e.target.value })}
              className="min-w-[150px]"
            >
              <option value="">Any status</option>
              <option value="avaiable">Available</option>
              <option value="rented">Rented</option>
              <option value="inative">Inactive</option>
            </Select>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowAdvanced((v) => !v)}
              aria-expanded={showAdvanced}
              className="shrink-0 gap-1.5"
            >
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </div>
        </div>

        {showAdvanced ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Select value={values.furnished} onChange={(e) => onChange({ furnished: e.target.value })}>
              <option value="">Furnished?</option>
              <option value="true">Furnished</option>
              <option value="false">Unfurnished</option>
            </Select>
            <Input
              placeholder="Min price (₦)"
              inputMode="numeric"
              value={values.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
            />
            <Input
              placeholder="Max price (₦)"
              inputMode="numeric"
              value={values.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
            />
            <Select value={values.rooms} onChange={(e) => onChange({ rooms: e.target.value })}>
              <option value="">Exact beds</option>
              <option value="1">1 bed</option>
              <option value="2">2 beds</option>
              <option value="3">3 beds</option>
              <option value="4">4 beds</option>
              <option value="5">5+ beds</option>
            </Select>
            <Input
              placeholder="Min beds"
              inputMode="numeric"
              value={values.minRooms}
              onChange={(e) => onChange({ minRooms: e.target.value })}
              className="sm:col-span-1"
            />
            <div className="col-span-2 flex items-center gap-2 sm:col-span-3">
              {hasActive ? (
                <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
                  <X className="size-3.5" /> Clear filters
                </Button>
              ) : null}
              {total !== undefined ? (
                <span className="ml-auto text-xs font-medium text-muted-foreground">{total} homes</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {hasActive ? (
              <Button variant="ghost" size="xs" onClick={onReset} className="gap-1">
                <X className="size-3" /> Clear
              </Button>
            ) : null}
            {total !== undefined ? (
              <span className="ml-auto text-xs font-medium text-muted-foreground">{total} homes found</span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
