import * as React from "react"
import "leaflet/dist/leaflet.css"

export const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 } as const

/**
 * Client-only Leaflet picker. Leaflet touches `window` at import time,
 * so it is dynamically imported after mount — SSR renders a placeholder.
 * Click to drop the pin, or drag the pin to fine-tune.
 */
export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number
  lng: number
  onChange: (pos: { lat: number; lng: number }) => void
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<import("leaflet").Map | null>(null)
  const markerRef = React.useRef<import("leaflet").Marker | null>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const L = await import("leaflet")
        if (cancelled || !containerRef.current || mapRef.current) return

        const map = L.map(containerRef.current).setView([lat, lng], 12)
        mapRef.current = map
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map)

        const pin = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:9999px;background:#4f39f6;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: pin,
        }).addTo(map)
        markerRef.current = marker

        map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
          marker.setLatLng(e.latlng)
          onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
        })
        marker.on("dragend", () => {
          const p = marker.getLatLng()
          onChangeRef.current({ lat: p.lat, lng: p.lng })
        })
        // fix tiles when the container finishes layout
        window.setTimeout(() => map.invalidateSize(), 100)
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // keep the map in sync when coords change from outside (e.g. geolocate)
  React.useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const current = marker.getLatLng()
    if (Math.abs(current.lat - lat) > 1e-9 || Math.abs(current.lng - lng) > 1e-9) {
      marker.setLatLng([lat, lng])
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng])

  React.useEffect(() => {
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  if (failed) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border bg-muted p-6 text-center text-sm text-muted-foreground">
        Map failed to load. You can still publish — coordinates default to Lagos.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div ref={containerRef} className="h-80 w-full bg-muted" aria-label="Property location map" />
      <p className="border-t bg-white px-3 py-2 text-xs text-muted-foreground">
        Click the map to drop the pin, or drag it. {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  )
}
