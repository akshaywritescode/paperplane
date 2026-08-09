import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SettingsAlert } from "../components/SettingsAlert";
import { updatePassword } from "../actions";
import type { Metadata } from "next";
import { MfaSetup } from "./MfaSetup";

export const metadata: Metadata = { title: "Security" };

type SecurityPageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const user = await getCurrentAppwriteUser();
  if (!user) redirect("/login?error=Please%20log%20in%20first");

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-8 py-2">
      {/* Page header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Security</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your password and two-factor authentication.
        </p>
      </div>

      <SettingsAlert error={params?.error} message={params?.message} />

      {/* ── Password ── */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Password
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update your password to keep your account secure.
          </p>
        </div>
        <form action={updatePassword} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="oldPassword" className="text-xs font-medium text-foreground">
              Current password
            </label>
            <PasswordInput
              id="oldPassword"
              name="oldPassword"
              required
              placeholder="••••••••"
              className="h-8 text-sm focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              New password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              placeholder="min 8 characters"
              className="h-8 text-sm focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-xs font-medium text-foreground">
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              placeholder="repeat password"
              className="h-8 text-sm focus:border-orange-400 focus:ring-orange-400/20"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white hover:bg-orange-700"
          >
            Update password
          </Button>
        </form>
      </section>

      <hr className="border-border" />

      {/* ── Two-factor authentication ── */}
      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Two-factor authentication
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add an extra layer of security using an authenticator app.
          </p>
        </div>
        <MfaSetup mfaEnabled={user.mfa} />
      </section>
    </div>
  );
}
