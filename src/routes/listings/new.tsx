import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listingsApi } from "#/lib/api";
import { useAuth } from "#/lib/auth";
import { useToast } from "#/components/ui/toast";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card";
import { MapPicker, LAGOS_CENTER } from "#/components/listing/map-picker";
import { PhotoInput } from "#/components/listing/photo-input";
import { LocateFixed } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/listings/new")({ component: NewListing });

function NewListing() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isVerified = !!user?.email_verified;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    price: "",
    rooms: "2",
    furnished: "false",
    address: "",
  });
  const [coords, setCoords] = React.useState({ lat: LAGOS_CENTER.lat, lng: LAGOS_CENTER.lng });
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "publishing" | "photos">("idle");
  const [locating, setLocating] = React.useState(false);

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
      });
      const urls = imageUrls.map((u) => u.trim()).filter(Boolean);
      if (urls.length > 0) {
        setPhase("photos");
        const results = await Promise.allSettled(
          urls.map((url, i) => listingsApi.addMedia(listing.id, { url, type: "image", order: i })),
        );
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          toast("Listing published, some photos failed", {
            description: `${urls.length - failed}/${urls.length} photos attached. You can add more from the listing page.`,
            variant: "error",
          });
        }
      }
      return listing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast("Listing published", { description: "Your home is now visible to renters." });
      navigate({ to: "/" });
    },
    onError: (e: Error) => {
      setPhase("idle");
      setError(e.message);
    },
  });

  if (isLoading) return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">Loading…</div>;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Sign in to list a home</p>
            <Button asChild className="mt-4"><a href="/auth/signin">Sign in</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!isVerified) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <Card>
          <CardHeader><CardTitle>Verify email to list</CardTitle><CardDescription>You can browse listings now. Verify to publish.</CardDescription></CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Check inbox ({user?.email}) or API logs for the verification link.</p>
            <Button asChild className="mt-4"><a href="/auth/verify">Go to verification</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhase("publishing");
    create.mutate();
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast("Geolocation not supported", { variant: "error" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast("Location set", { description: "Pin moved to your current position." });
      },
      () => {
        setLocating(false);
        toast("Could not get location", { description: "Check browser permission and try again.", variant: "error" });
      },
      { timeout: 10000 },
    );
  };

  const busy = phase !== "idle";

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
              <Input id="title" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="2-bedroom flat in Yaba" />
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
                <Input id="price" required inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2500000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rooms">Beds</Label>
                <Input id="rooms" type="number" min={0} value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="furnished">Furnished</Label>
                <select id="furnished" value={form.furnished} onChange={(e) => setForm({ ...form, furnished: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="12 Herbert Macaulay Way, Yaba" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Pin the location</Label>
                <Button type="button" variant="ghost" size="xs" onClick={useMyLocation} disabled={locating} className="gap-1">
                  <LocateFixed className="size-3.5" />
                  {locating ? "Locating…" : "Use my location"}
                </Button>
              </div>
              <MapPicker lat={coords.lat} lng={coords.lng} onChange={setCoords} />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <PhotoInput
                urls={imageUrls}
                onChange={setImageUrls}
                onUploadError={(message) => toast("Upload failed", { description: message, variant: "error" })}
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
  );
}
