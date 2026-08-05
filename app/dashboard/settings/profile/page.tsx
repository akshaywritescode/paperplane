import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { getAvatarUrl } from "@/lib/avatar";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SettingsAlert } from "../components/SettingsAlert";
import {
  resendEmailVerification,
  updateProfileEmail,
  updateProfileName,
  updateProfileAvatar,
  deleteProfileAvatar,
} from "../actions";
import type { Metadata } from "next";
import { CheckCircle2, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile",
};

type ProfilePageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentAppwriteUser();

  if (!user) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  const params = await searchParams;
  const avatarUrl = getAvatarUrl(user.email || user.name || "paperplane", user.prefs?.avatarId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your personal information and email address.
        </p>
      </div>

      <SettingsAlert error={params?.error} message={params?.message} />

      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>
            Your avatar is generated from your email address or uploaded by you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <img
              src={avatarUrl}
              alt={user.name || "User avatar"}
              className="size-16 rounded-xl bg-orange-100 object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {user.name || "User"}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.emailVerification ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  Verified
                </span>
              ) : (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Mail className="size-3" />
                  Unverified
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action={updateProfileAvatar} className="flex flex-1 items-center gap-2">
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                className="max-w-[250px]"
                required
              />
              <Button type="submit" variant="outline" size="sm">
                Upload
              </Button>
            </form>
            {user.prefs?.avatarId && (
              <form action={deleteProfileAvatar}>
                <Button type="submit" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                  Remove Picture
                </Button>
              </form>
            )}
          </div>
          
          {!user.emailVerification && (
            <form action={resendEmailVerification} className="mt-4 border-t pt-4">
              <Button type="submit" variant="outline" size="sm">
                Resend verification email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>
            This is how your name appears across Paperplane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileName} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Full name
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                placeholder="Jane Smith"
              />
            </div>
            <Button
              type="submit"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email address</CardTitle>
          <CardDescription>
            Changing your email requires your current password and will reset
            verification status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                placeholder="jane@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="email-password"
                className="text-sm font-medium text-foreground"
              >
                Current password
              </label>
              <PasswordInput
                id="email-password"
                name="password"
                required
                placeholder="Enter your password"
                className="border-input bg-transparent focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
            <Button
              type="submit"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Update email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
