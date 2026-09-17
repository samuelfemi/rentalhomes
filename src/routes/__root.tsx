import { HeadContent, Scripts, createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { QueryProvider } from '#/providers/query-provider'
import { AuthProvider } from '#/lib/auth'
import { Header } from '#/components/layout/header'
import { VerifyBanner } from '#/components/layout/verify-banner'
import { ToastProvider } from '#/components/ui/toast'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'EazyRent — Find home, easily.' },
      {
        name: 'description',
        content: 'House rental platform for Nigeria. Browse verified listings, save favorites, and list your property.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you’re looking for doesn’t exist or was moved.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90">
        Back to homes
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#fcfcf9] text-foreground antialiased">
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
            <Header />
            <VerifyBanner />
            <div className="min-h-[calc(100vh-64px)]">{children ?? <Outlet />}</div>
            <footer className="border-t bg-white">
              <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>© {new Date().getFullYear()} EazyRent — Built for the Nigerian market.</span>
                <span className="flex gap-4">
                  <a href="http://localhost:8080/swagger/index.html" target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
                    API Docs
                  </a>
                  <span>PostGIS • Go • TanStack</span>
                </span>
              </div>
            </footer>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
