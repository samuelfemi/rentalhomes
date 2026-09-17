import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "#/lib/auth";
import { authApi } from "#/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card";
import { isCloudinaryConfigured, uploadImageToCloudinary } from "#/lib/cloudinary";
import { errorMessage } from "#/lib/errors";
import { useToast } from "#/components/ui/toast";
import { Loader2, Upload } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/me")({ component: MePage });

function MePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user?.avatar_url) setUrl(user.avatar_url);
  }, [user?.avatar_url]);

  const mutate = useMutation({
    mutationFn: (avatarUrl: string) => authApi.updateAvatar(avatarUrl.trim()),
    onSuccess: () => {
      setMsg("Avatar updated");
      setErr(null);
      refreshUser();
    },
    onError: (e: Error) => {
      setErr(e.message);
      setMsg(null);
    },
  });

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const secureUrl = await uploadImageToCloudinary(file);
      setUrl(secureUrl);
      mutate.mutate(secureUrl);
      toast("Profile photo updated");
    } catch (e) {
      const message = errorMessage(e, "Upload failed");
      setErr(message);
      toast("Upload failed", { description: message, variant: "error" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (isLoading) return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">Loading…</div>;
  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">Sign in to view your profile</p>
            <a href="/auth/signin" className="text-sm font-semibold text-primary hover:underline">
              Go to sign in
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold">Profile</h1>
      <p className="text-sm text-muted-foreground">Manage your account and avatar</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="size-10 rounded-full object-cover" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.full_name[0]?.toUpperCase()}
              </span>
            )}
            {user.full_name}
          </CardTitle>
          <CardDescription>{user.email} • {user.phone}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Email verified</p>
              <p className="font-semibold">{user.email_verified ? "Yes" : "No — check inbox for verification link"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="font-semibold">{new Date(user.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>Upload a photo or paste an image link. Leave empty to clear.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {url ? (
              <img src={url} alt="Avatar preview" className="size-16 rounded-full border object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                {user.full_name[0]?.toUpperCase()}
              </span>
            )}
            {isCloudinaryConfigured() ? (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleFile(e.target.files)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={uploading || mutate.isPending || !user.email_verified}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" /> Upload photo
                    </>
                  )}
                </Button>
              </div>
            ) : null}
          </div>
          {!user.email_verified ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Verify email to change avatar — updates are blocked until verified.</p> : null}
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={!user.email_verified} />
          {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <Button onClick={() => mutate.mutate(url)} disabled={mutate.isPending || uploading || !user.email_verified}>
            {mutate.isPending ? "Saving…" : "Save avatar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
