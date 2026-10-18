import { TanStackDevtools } from "@tanstack/react-devtools"
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Header } from "#/components/layout/header"
import { VerifyBanner } from "#/components/layout/verify-banner"
import { Button } from "#/components/ui/button"
import { ToastProvider } from "#/components/ui/toast"
import { AuthProvider } from "#/lib/auth"
import { errorMessage } from "#/lib/errors"
import { getQueryClient } from "#/providers/query-provider"
import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EazyRent — Find home, easily." },
      {
        name: "description",
        content: "House rental platform for Nigeria. Browse verified listings, save favorites, and list your property.",
      },
      { name: "theme-color", content: "#4f39f6" },
      { property: "og:title", content: "EazyRent — Find home, easily." },
      {
        property: "og:description",
        content: "House rental platform for Nigeria. Browse verified listings, save favorites, and list your property.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "EazyRent" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

function NotFound() {
  return (
    <div className="mx-auto max-w-160 px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase text-muted-foreground">404</p>
      <h1 className="mt-2 text-balance text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase text-primary-foreground hover:bg-primary/90"
      >
        Back to homes
      </Link>
    </div>
  )
}

function RouteError({ error }: { error: unknown }) {
  return (
    <div className="mx-auto max-w-160 px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage(error, "An unexpected error occurred.")}</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to homes</Link>
        </Button>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-paper text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <Header />
              <VerifyBanner />
              <div className="min-h-main">{children ?? <Outlet />}</div>
              <footer className="border-t bg-white">
                <div className="mx-auto flex max-w-320 flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <span>© {new Date().getFullYear()} EazyRent — Built for the Nigerian market.</span>
                  <span className="flex gap-4">
                    {import.meta.env.DEV ? (
                      <a
                        href="http://localhost:8080/swagger/index.html"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground hover:underline"
                      >
                        API Docs
                      </a>
                    ) : null}
                    <span>PostGIS • Go • TanStack</span>
                  </span>
                </div>
              </footer>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
