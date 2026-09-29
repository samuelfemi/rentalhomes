import { cn } from "cn"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import * as React from "react"

type ToastVariant = "success" | "error" | "info"

type ToastItem = {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (title: string, opts?: { description?: string; variant?: ToastVariant }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (title: string, opts?: { description?: string; variant?: ToastVariant }) => {
      const id = nextId++
      const item: ToastItem = {
        id,
        title,
        description: opts?.description,
        variant: opts?.variant ?? "success",
      }
      setToasts((prev) => [...prev.slice(-2), item])
      window.setTimeout(() => dismiss(id), 3500)
    },
    [dismiss],
  )

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg",
              t.variant === "success" && "border-emerald-200",
              t.variant === "error" && "border-destructive/30",
              t.variant === "info" && "border-border",
            )}
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : t.variant === "error" ? (
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            ) : (
              <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be inside ToastProvider")
  return ctx
}
