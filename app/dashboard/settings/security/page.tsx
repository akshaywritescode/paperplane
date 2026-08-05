import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SettingsAlert } from "../components/SettingsAlert";
import { updatePassword } from "../actions";
import type { Metadata } from "next";
import { MfaSetup } from "./MfaSetup";

export const metadata: Metadata = {
  title: "Security",
};

type SecurityPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const user = await getCurrentAppwriteUser();
  if (!user) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  const params = await searchParams;
  const mfaEnabled = user.mfa;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and security settings.
        </p>
      </div>

      <SettingsAlert error={params?.error} message={params?.message} />

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="oldPassword" className="text-sm font-medium">Current password</label>
              <PasswordInput id="oldPassword" name="oldPassword" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <PasswordInput id="password" name="password" required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</label>
              <PasswordInput id="confirmPassword" name="confirmPassword" required />
            </div>
            <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700">
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaSetup mfaEnabled={mfaEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
