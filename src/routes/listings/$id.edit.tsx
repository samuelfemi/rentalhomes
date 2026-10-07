import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { MapPin } from "lucide-react"
import * as React from "react"
import { PhotoInput } from "#/components/listing/photo-input"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { useToast } from "#/components/ui/toast"
import { listingsApi } from "#/lib/api"
import { errorMessage } from "#/lib/errors"
import { geocodeAddress } from "#/lib/geocode"

export const Route = createFileRoute("/listings/$id/edit")({
  component: EditPage,
})

function EditPage() {
  const { id } = Route.useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data } = useQuery({
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

  React.useEffect(() => {
    if (data?.listing) {
      setForm({
        title: data.listing.title,
        description: data.listing.description,
        price: data.listing.price,
        rooms: String(data.listing.rooms ?? 0),
        address: data.listing.address,
      })
      setStatus(data.listing.status)
    }
  }, [data])

  const update = useMutation({
    mutationFn: () =>
      listingsApi.update(id, {
        title: form.title,
        description: form.description,
        price: form.price,
        rooms: Number(form.rooms),
        address: form.address,
        ...(geo ? { latitude: geo.lat, longitude: geo.lng } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] })
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
      qc.invalidateQueries({ queryKey: ["listing", id] })
      setMsg("Status updated")
    },
    onError: (e: Error) => setErr(e.message),
  })

  const addMedia = useMutation({
    mutationFn: async () => {
      const base = data?.media.length ?? 0
      for (let i = 0; i < newPhotos.length; i++) {
        await listingsApi.addMedia(id, {
          url: newPhotos[i],
          type: "image",
          order: base + i,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] })
      setNewPhotos([])
      setMsg(newPhotos.length > 1 ? `${newPhotos.length} photos added` : "Photo added")
      setErr(null)
    },
    onError: (e: Error) => setErr(e.message),
  })

  if (!data) return <div className="mx-auto max-w-180 px-4 py-10">Loading…</div>

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
            <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-25 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price</Label>
              <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label>Beds</Label>
              <Input type="number" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} />
            </div>
          </div>
          <Label>Address</Label>
          <Input
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
            <select
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
              <img key={m.id} src={m.url} alt="" className="aspect-square rounded-lg object-cover border" />
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
              {addMedia.isPending ? "Attaching…" : `Attach ${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""}`}
            </Button>
          ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
