import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { MapPin } from "lucide-react"
import * as React from "react"
import { AccountGate } from "#/components/auth/account-gate"
import { PhotoInput } from "#/components/listing/photo-input"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { useToast } from "#/components/ui/toast"
import { type ListingUpdate, listingsApi } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import { requireAuth } from "#/lib/auth-guard"
import { errorMessage } from "#/lib/errors"
import { geocodeAddress } from "#/lib/geocode"

export const Route = createFileRoute("/listings/$id/edit")({
  beforeLoad: requireAuth,
  component: EditPage,
})

function EditPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.get(id),
  })

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    price: "",
    rooms: "",
    address: "",
  })
  const [status, setStatus] = React.useState("")
  const [newPhotos, setNewPhotos] = React.useState<string[]>([])
  const [msg, setMsg] = React.useState<string | null>(null)
  const [err, setErr] = React.useState<string | null>(null)
  // Set only when the landlord asks to re-resolve the address, so a plain
  // address typo fix never silently moves the pin.
  const [geo, setGeo] = React.useState<{ lat: number; lng: number; label: string } | null>(null)
  const [geocoding, setGeocoding] = React.useState(false)
  // Hydrate the form once per listing id: refetches must not clobber edits,
  // but navigating to another listing's edit page must re-hydrate.
  const [hydratedId, setHydratedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!data?.listing || hydratedId === id) return
    setForm({
      title: data.listing.title,
      description: data.listing.description,
      price: data.listing.price,
      rooms: String(data.listing.rooms ?? 0),
      address: data.listing.address,
    })
    setStatus(data.listing.status)
    setHydratedId(id)
  }, [data, id, hydratedId])

  const update = useMutation({
    mutationFn: () => {
      const rooms = Number.parseInt(form.rooms, 10)
      const payload: ListingUpdate = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        // Never send NaN when the field is cleared — fall back to the
        // currently stored value instead.
        rooms: Number.isFinite(rooms) ? rooms : (data?.listing.rooms ?? 0),
        address: form.address.trim(),
      }
      if (geo) {
        payload.latitude = geo.lat
        payload.longitude = geo.lng
      }
      return listingsApi.update(id, payload)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["listing", id] })
      void qc.invalidateQueries({ queryKey: ["my-listings"] })
      setMsg(geo ? "Saved, location updated" : "Saved")
      setErr(null)
      setGeo(null)
    },
    onError: (e: Error) => setErr(e.message),
  })

  const resolveAddress = async () => {
    setGeocoding(true)
    setErr(null)
    try {
      const hit = await geocodeAddress(form.address)
      setGeo(hit)
      toast("Location resolved", { description: `${hit.lat.toFixed(5)}, ${hit.lng.toFixed(5)}` })
    } catch (e) {
      setErr(errorMessage(e, "Could not look up that address"))
    } finally {
      setGeocoding(false)
    }
  }

  const updateStatus = useMutation({
    mutationFn: () => listingsApi.updateStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["listing", id] })
      void qc.invalidateQueries({ queryKey: ["my-listings"] })
      setMsg("Status updated")
    },
    onError: (e: Error) => setErr(e.message),
  })

  const addMedia = useMutation({
    mutationFn: async () => {
      const base = data?.media.length ?? 0
      const results = await Promise.allSettled(
        newPhotos.map((url, i) => listingsApi.addMedia(id, { url, type: "image", order: base + i })),
      )
      const failed = results.filter((r) => r.status === "rejected").length
      if (failed > 0) {
        throw new Error(`${newPhotos.length - failed}/${newPhotos.length} photos attached — try again for the rest.`)
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["listing", id] })
      setMsg(newPhotos.length > 1 ? `${newPhotos.length} photos added` : "Photo added")
      setNewPhotos([])
      setErr(null)
    },
    onError: (e: Error) => setErr(e.message),
  })

  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-180 px-4 py-10 sm:px-6">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-180 px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
          <p className="font-semibold text-destructive">Could not load this listing</p>
          <p className="text-sm text-muted-foreground">{errorMessage(error, "Check the URL or try again.")}</p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/my-listings">Back to my listings</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AccountGate
        variant="signed-out"
        title="Sign in to edit listings"
        description="Only the landlord who created a listing can edit it."
      />
    )
  }

  if (user && user.id !== data.listing.landlord_id) {
    return (
      <div className="mx-auto max-w-320 px-4 py-16 sm:px-6">
        <div className="rounded-2xl border bg-white p-10 text-center">
          <h1 className="text-xl font-bold">You can’t edit this listing</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Only the landlord who created it can make changes.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/listings/$id" params={{ id }}>
              View listing
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-180 px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold">Edit listing</h1>
      <p className="text-sm text-muted-foreground">Update details, status and images</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-rooms">Beds</Label>
                <Input
                  id="edit-rooms"
                  type="number"
                  min={0}
                  value={form.rooms}
                  onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                />
              </div>
            </div>
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={form.address}
              onChange={(e) => {
                setForm({ ...form, address: e.target.value })
                setGeo(null)
              }}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {geo
                  ? `Location will move to ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`
                  : data?.listing
                    ? `Current: ${data.listing.latitude.toFixed(5)}, ${data.listing.longitude.toFixed(5)}`
                    : ""}
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="shrink-0"
                onClick={() => void resolveAddress()}
                disabled={geocoding || form.address.trim().length < 4 || update.isPending}
              >
                <MapPin className="size-3.5" />
                {geocoding ? "Locating…" : "Use address"}
              </Button>
            </div>
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            {msg ? <p className="text-sm text-success-600">{msg}</p> : null}
            <div className="flex gap-2">
              <Button onClick={() => update.mutate()} disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/listings/$id", params: { id } })}>
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Label className="sr-only" htmlFor="edit-status">
              Listing status
            </Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="avaiable">Available</option>
              <option value="rented">Rented</option>
              <option value="inative">Inactive</option>
            </select>
            <Button onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending}>
              Update status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {data.media.map((m) => (
                <img
                  key={m.id}
                  src={m.url}
                  alt=""
                  className="aspect-square rounded-lg border object-cover"
                  loading="lazy"
                />
              ))}
            </div>
            {data.media.length === 0 ? <p className="text-sm text-muted-foreground">No images yet</p> : null}
            <PhotoInput
              urls={newPhotos}
              onChange={setNewPhotos}
              onUploadError={(message) => toast("Upload failed", { description: message, variant: "error" })}
            />
            {newPhotos.length > 0 ? (
              <Button onClick={() => addMedia.mutate()} disabled={addMedia.isPending}>
                {addMedia.isPending
                  ? "Attaching…"
                  : `Attach ${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""}`}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
