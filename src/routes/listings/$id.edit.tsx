import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import * as React from "react"
import { PhotoInput } from "#/components/listing/photo-input"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { useToast } from "#/components/ui/toast"
import { listingsApi } from "#/lib/api"

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
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing", id] })
      setMsg("Saved")
      setErr(null)
    },
    onError: (e: Error) => setErr(e.message),
  })

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

  if (!data) return <div className="mx-auto max-w-[720px] px-4 py-10">Loading…</div>

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold">Edit listing</h1>
      <p className="text-sm text-muted-foreground">Update details, status and images</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Label>Description</Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
          <div className="flex gap-2">
            <Button onClick={() => update.mutate()} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/listings/$id", params: { id } })}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
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
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>
    </div>
  )
}
