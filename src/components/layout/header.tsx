import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useAuth } from "#/lib/auth";
import { Building2, Heart, LayoutDashboard, LogOut, Plus, User } from "lucide-react";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const isVerified = !!user?.email_verified;
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-[64px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-extrabold tracking-tight">EazyRent</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">
              Find home, easily
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted [&.active]:bg-muted [&.active]:font-semibold"
          >
            Browse
          </Link>
          {isAuthenticated && isVerified ? (
            <>
              <Link to="/favorites" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                Favorites
              </Link>
              <Link to="/my-listings" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                My listings
              </Link>
            </>
          ) : isAuthenticated && !isVerified ? (
            <span className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">Verify email to access favorites & listings</span>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {isVerified ? (
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/listings/new">
                    <Plus className="size-3.5" />
                    List a home
                  </Link>
                </Button>
              ) : null}
              {isVerified ? (
                <Button asChild size="icon-sm" variant="ghost" aria-label="Favorites" className="relative">
                  <Link to="/favorites">
                    <Heart className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/me"
                  className="flex items-center gap-2 rounded-full border bg-card px-2 py-1 pr-3 text-sm font-medium hover:bg-muted"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {(user?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">{user?.full_name ?? user?.email}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Sign out"
                  onClick={async () => {
                    await logout();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
              {/* mobile auth actions */}
              <div className="flex items-center gap-1 sm:hidden">
                <Button asChild size="icon-sm" variant="ghost" aria-label="Profile">
                  <Link to="/me">
                    <User className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="icon-sm" variant="ghost" aria-label="My listings">
                  <Link to="/my-listings">
                    <LayoutDashboard className="size-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth/signup">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* mobile secondary nav */}
      {isAuthenticated ? (
        <div className="flex items-center gap-1 border-t px-4 py-2 md:hidden">
          <Link to="/" className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold">
            Browse
          </Link>
          {isVerified ? (
            <>
              <Link to="/favorites" className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-muted">
                Favorites
              </Link>
              <Link to="/my-listings" className="rounded-md px-3 py-1.5 text-xs font-medium hover:bg-muted">
                My listings
              </Link>
              <Link to="/listings/new" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                + List a home
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
