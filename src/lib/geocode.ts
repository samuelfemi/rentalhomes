/**
 * Forward-geocode a free-text address to coordinates.
 *
 * Uses OpenStreetMap Nominatim — the same data source as the map tiles in
 * map-picker.tsx, so no API key or billing account is needed. It is a public
 * service with a usage policy capping requests (1/second), so callers must
 * debounce; the browser sends its own Referer, which satisfies the policy.
 */
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

export type GeocodeResult = {
  lat: number
  lng: number
  label: string
}

type NominatimPlace = {
  lat?: string
  lon?: string
  display_name?: string
}

export class GeocodeError extends Error {
  /** True when Nominatim found nothing, as opposed to a transport failure. */
  readonly notFound: boolean

  constructor(message: string, notFound = false) {
    super(message)
    this.name = "GeocodeError"
    this.notFound = notFound
  }
}

export async function geocodeAddress(address: string, signal?: AbortSignal): Promise<GeocodeResult> {
  const q = address.trim()
  if (!q) throw new GeocodeError("Enter an address to search for it.")

  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "1",
    // Nigeria is the only market served, so bias results to the country
    // and let Nominatim rank within it.
    countrycodes: "ng",
    addressdetails: "0",
  })

  let res: Response
  try {
    res = await fetch(`${NOMINATIM_URL}?${params}`, {
      signal,
      headers: { Accept: "application/json" },
    })
  } catch {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError")
    throw new GeocodeError("Could not reach the geocoding service — check your connection.")
  }

  if (res.status === 429 || res.status === 503) {
    throw new GeocodeError("Geocoding is busy right now — try again in a moment.")
  }
  if (!res.ok) {
    throw new GeocodeError(`Geocoding failed (${res.status}).`)
  }

  // SAFETY: Nominatim returns a JSON array of place objects; a non-array or
  // missing lat/lon falls through to the notFound branch below.
  const body = (await res.json().catch(() => null)) as NominatimPlace[] | null
  const place = Array.isArray(body) ? body[0] : undefined
  const lat = Number(place?.lat)
  const lng = Number(place?.lon)
  if (!place || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new GeocodeError(`No match for “${q}” — try adding a city or state.`, true)
  }

  return { lat, lng, label: place.display_name ?? q }
}
