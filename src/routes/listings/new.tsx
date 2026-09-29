import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { LocateFixed, MapPin } from "lucide-react"
import * as React from "react"
import { LAGOS_CENTER, MapPicker } from "#/components/listing/map-picker"
import { PhotoInput } from "#/components/listing/photo-input"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { useToast } from "#/components/ui/toast"
import { listingsApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { errorMessage } from "#/lib/errors"
import { geocodeAddress } from "#/lib/geocode"

export const Route = createFileRoute("/listings/new")({
  component: NewListing,
})

type Coords = { lat: number; lng: number }

function NewListing() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const isVerified = !!user?.email_verified
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    price: "",
    rooms: "2",
    furnished: "false",
    address: "",
  })
  const [coords, setCoords] = React.useState<Coords>({
    lat: LAGOS_CENTER.lat,
    lng: LAGOS_CENTER.lng,
  })
  const [imageUrls, setImageUrls] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<"idle" | "publishing" | "photos">("idle")
  const [locating, setLocating] = React.useState(false)
  const [geocoding, setGeocoding] = React.useState(false)
  const [geoNote, setGeoNote] = React.useState<string | null>(null)
  const [geoError, setGeoError] = React.useState<string | null>(null)
  // Tracks the address the current pin came from, so auto-geocoding does not
  // fight a pin the user dragged by hand.
  const pinnedFromRef = React.useRef<string>("")

  const create = useMutation({
    mutationFn: async () => {
      const listing = await listingsApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        rooms: Number(form.rooms),
        furnished: form.furnished === "true",
        latitude: coords.lat,
        longitude: coords.lng,
        address: form.address.trim(),
      })
      const urls = imageUrls.map((u) => u.trim()).filter(Boolean)
      if (urls.length > 0) {
        setPhase("photos")
        const results = await Promise.allSettled(
          urls.map((url, i) => listingsApi.addMedia(listing.id, { url, type: "image", order: i })),
        )
        const failed = results.filter((r) => r.status === "rejected").length
        if (failed > 0) {
          toast("Listing published, some photos failed", {
            description: `${urls.length - failed}/${urls.length} photos attached. You can add more from the listing page.`,
            variant: "error",
          })
        }
      }
      return listing
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] })
      qc.invalidateQueries({ queryKey: ["my-listings"] })
      toast("Listing published", {
        description: "Your home is now visible to renters.",
      })
      navigate({ to: "/" })
    },
    onError: (e: Error) => {
      setPhase("idle")
      setError(e.message)
    },
  })

  const applyCoords = React.useCallback((next: Coords, from: string) => {
    setCoords(next)
    pinnedFromRef.current = from
  }, [])

  // Geocode the typed address and move the pin. Runs on an explicit button
  // press and automatically once the address stops changing, so the pin
  // tracks what the landlord typed without them hunting for it by hand.
  const lookupAddress = React.useCallback(
    async (address: string, { silent }: { silent: boolean }) => {
      const q = address.trim()
      if (q.length < 4) return
      setGeocoding(true)
      setGeoError(null)
      try {
        const hit = await geocodeAddress(q)
        applyCoords({ lat: hit.lat, lng: hit.lng }, q)
        setGeoNote(`${hit.lat.toFixed(5)}, ${hit.lng.toFixed(5)}`)
        if (!silent) {
          toast("Pin moved to your address", { description: hit.label })
        }
      } catch (e) {
        setGeoNote(null)
        setGeoError(errorMessage(e, "Could not look up that address"))
      } finally {
        setGeocoding(false)
      }
    },
    [applyCoords, toast],
  )

  // Debounced auto-geocode. Nominatim allows ~1 request/second, so wait for
  // the address to settle and skip if the pin no longer matches the text.
  React.useEffect(() => {
    const q = form.address.trim()
    if (q.length < 4) return
    if (q === pinnedFromRef.current) return
    const id = window.setTimeout(() => {
      void lookupAddress(q, { silent: true })
    }, 900)
    return () => window.clearTimeout(id)
  }, [form.address, lookupAddress])

  if (isLoading) return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">Loading…</div>
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Sign in to list a home</p>
            <Button asChild className="mt-4">
              <a href="/auth/signin">Sign in</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (!isVerified) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Verify email to list</CardTitle>
            <CardDescription>You can browse listings now. Verify to publish.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Check inbox ({user?.email}) or API logs for the verification link.
            </p>
            <Button asChild className="mt-4">
              <a href="/auth/verify">Go to verification</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setPhase("publishing")
    create.mutate()
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported", { variant: "error" })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Manual placement wins: record the current text so the debounced
        // geocoder does not snap the pin back to the address.
        applyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }, form.address.trim())
        setGeoNote(null)
        setGeoError(null)
        setLocating(false)
        toast("Location set", {
          description: "Pin moved to your current position.",
        })
      },
      () => {
        setLocating(false)
        toast("Could not get location", {
          description: "Check browser permission and try again.",
          variant: "error",
        })
      },
      { timeout: 10000 },
    )
  }

  const busy = phase !== "idle"

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold">List a home</h1>
      <p className="text-sm text-muted-foreground">Details, photos and an exact pin — done in one step.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Property details</CardTitle>
          <CardDescription>Price in Naira per year</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                minLength={3}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="2-bedroom flat in Yaba"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                required
                minLength={10}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Spacious, well-ventilated with parking and water…"
                className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (₦ per year)</Label>
                <Input
                  id="price"
                  required
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="2500000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rooms">Beds</Label>
                <Input
                  id="rooms"
                  type="number"
                  min={0}
                  value={form.rooms}
                  onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="furnished">Furnished</Label>
                <select
                  id="furnished"
                  value={form.furnished}
                  onChange={(e) => setForm({ ...form, furnished: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  required
                  value={form.address}
                  onChange={(e) => {
                    setForm({ ...form, address: e.target.value })
                    setGeoError(null)
                  }}
                  placeholder="12 Herbert Macaulay Way, Yaba"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {geoError ??
                      (geocoding ? "Looking up address…" : "We place the pin from your address automatically.")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="gap-1 shrink-0"
                    onClick={() => void lookupAddress(form.address, { silent: false })}
                    disabled={geocoding || form.address.trim().length < 4}
                  >
                    <MapPin className="size-3.5" />
                    {geocoding ? "Locating…" : "Use address"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Pin the location</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="gap-1"
                >
                  <LocateFixed className="size-3.5" />
                  {locating ? "Locating…" : "Use my location"}
                </Button>
              </div>
              <MapPicker
                lat={coords.lat}
                lng={coords.lng}
                onChange={(pos) => {
                  applyCoords(pos, form.address.trim())
                  setGeoNote(null)
                }}
              />
              {geoNote ? (
                <p className="text-xs text-muted-foreground">
                  Pin set from address: <span className="font-mono">{geoNote}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <PhotoInput
                urls={imageUrls}
                onChange={setImageUrls}
                onUploadError={(message) =>
                  toast("Upload failed", {
                    description: message,
                    variant: "error",
                  })
                }
              />
            </div>

            {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

            <Button type="submit" disabled={busy} className="w-full">
              {phase === "photos" ? "Adding photos…" : phase === "publishing" ? "Publishing…" : "Publish listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
