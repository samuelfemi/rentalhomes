import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import * as React from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { isCloudinaryConfigured, uploadImageToCloudinary } from "#/lib/cloudinary"
import { errorMessage } from "#/lib/errors"

/**
 * Collect listing photos: direct file upload to Cloudinary when the
 * unsigned preset is configured, plus manual URL paste as fallback.
 * The first photo becomes the cover.
 */
export function PhotoInput({
  urls,
  onChange,
  onUploadError,
}: {
  urls: string[]
  onChange: (urls: string[]) => void
  onUploadError?: (message: string) => void
}) {
  const [uploading, setUploading] = React.useState(0)
  const [link, setLink] = React.useState("")
  const [linkError, setLinkError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const cloudReady = isCloudinaryConfigured()

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const list = Array.from(files)
    setUploading((n) => n + list.length)
    // Slots preserve selection order while uploads race; lastPublished lets
    // each progressive update replace (not duplicate) our earlier appends
    // without clobbering edits the parent made meanwhile.
    const slots: (string | undefined)[] = list.map(() => undefined)
    let lastPublished: string[] = []
    const publish = () => {
      const fresh = urlsRef.current.filter((u) => !lastPublished.includes(u))
      const ours = slots.filter((u): u is string => u !== undefined)
      lastPublished = ours
      onChange([...fresh, ...ours])
    }
    await Promise.allSettled(
      list.map(async (file, i) => {
        try {
          slots[i] = await uploadImageToCloudinary(file)
          publish()
        } catch (err) {
          onUploadError?.(errorMessage(err, "Upload failed"))
        } finally {
          setUploading((n) => Math.max(0, n - 1))
        }
      }),
    )
    if (fileRef.current) fileRef.current.value = ""
  }

  // onChange identity changes each render — keep a ref so the async
  // loop above always appends to the latest list.
  const urlsRef = React.useRef(urls)
  urlsRef.current = urls

  const addLink = () => {
    const trimmed = link.trim()
    try {
      const u = new URL(trimmed)
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error()
    } catch {
      setLinkError("Enter a valid http(s) image link.")
      return
    }
    setLinkError(null)
    onChange([...urls, trimmed])
    setLink("")
  }

  return (
    <div className="space-y-3">
      {cloudReady ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading > 0}
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full gap-1.5"
            disabled={uploading > 0}
            onClick={() => fileRef.current?.click()}
          >
            {uploading > 0 ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Uploading {uploading}…
              </>
            ) : (
              <>
                <Upload className="size-4" /> Upload photos
              </>
            )}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP or GIF, up to 10 MB each.</p>
        </div>
      ) : (
        <p className="rounded-md border border-dashed bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          Direct upload needs <code>VITE_CLOUDINARY_CLOUD_NAME</code> + <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> in
          the frontend env — until then, paste image links below.
        </p>
      )}

      {urls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {urls.map((url, i) => (
            <div
              key={`${i}-${url}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                  COVER
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ImagePlus className="size-4" /> No photos yet
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Input placeholder="…or paste an image link https://…" value={link} onChange={(e) => setLink(e.target.value)} />
        <Button type="button" variant="outline" onClick={addLink} disabled={!link.trim()}>
          Add
        </Button>
      </div>
      {linkError ? <p className="text-xs text-destructive">{linkError}</p> : null}
    </div>
  )
}
