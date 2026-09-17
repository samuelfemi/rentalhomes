import { Link } from "@tanstack/react-router";
import { useAuth } from "#/lib/auth";
import { MailWarning } from "lucide-react";

export function VerifyBanner() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return null;
  if (user.email_verified) return null;

  return (
    <div className="border-b bg-amber-50">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="inline-flex items-center gap-2 font-medium text-amber-900">
          <MailWarning className="size-4 shrink-0" />
          Verify your email to unlock everything — you can browse listings, but favorites, listing and contact details require verification.
        </span>
        <span className="flex items-center gap-3 text-xs">
          <span className="hidden text-amber-800 sm:inline">Check inbox ({user.email}) or API logs.</span>
          <Link to="/auth/verify" className="inline-flex h-7 items-center rounded-md bg-amber-900 px-3 font-semibold text-white hover:bg-amber-800">
            Verify
          </Link>
        </span>
      </div>
    </div>
  );
}
