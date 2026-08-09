import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { getAvatarUrl } from "@/lib/avatar";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SettingsAlert } from "../components/SettingsAlert";
import { AvatarUploadForm } from "./AvatarUploadForm";
import {
  resendEmailVerification,
  updateProfileEmail,
  updateProfileName,
} from "../actions";
import type { Metadata } from "next";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

type ProfilePageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentAppwriteUser();
  if (!user) redirect("/login?error=Please%20log%20in%20first");

  const params = await searchParams;
  const avatarUrl = getAvatarUrl(
    user.email || user.name || "paperplane",
    user.prefs?.avatarId,
  );

  return (
    <div className="mx-auto max-w-xl space-y-12 py-2">
      {/* Page header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <SettingsAlert error={params?.error} message={params?.message} />

      {/* ── Identity card ── */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <AvatarUploadForm
            avatarUrl={avatarUrl}
            userName={user.name || "User"}
            hasCustomAvatar={!!user.prefs?.avatarId}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name || "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            {user.emailVerification ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="size-2.5" />
                Verified
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Mail className="size-2.5" />
                Unverified
              </span>
            )}
          </div>
        </div>

        {!user.emailVerification && (
          <form action={resendEmailVerification} className="mt-4 border-t pt-4">
            <button
              type="submit"
              className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              Resend verification email →
            </button>
          </form>
        )}
      </section>

      {/* ── Display name ── */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Display name
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How your name appears across Paperplane.
          </p>
        </div>
        <form action={updateProfileName} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="name" className="text-xs font-medium text-foreground">
              Full name
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name}
              required
              placeholder="Jane Smith"
              className="h-8 text-sm"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white hover:bg-orange-700"
          >
            Save
          </Button>
        </form>
      </section>

      {/* ── Email address ── */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email address
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Requires your current password. Resets verification status.
          </p>
        </div>
        <form action={updateProfileEmail} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              placeholder="jane@company.com"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="email-password" className="text-xs font-medium text-foreground">
              Current password
            </label>
            <PasswordInput
              id="email-password"
              name="password"
              required
              placeholder="••••••••"
              className="h-8 text-sm focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white hover:bg-orange-700"
          >
            Update email
          </Button>
        </form>
      </section>
    </div>
  );
}
