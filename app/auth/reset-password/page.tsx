import { griffy } from "@/app/font";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { resetPassword } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Paperplane account.",
  robots: { index: false, follow: false },
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    userId?: string;
    secret?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  // Missing token params — link is invalid
  if (!params?.userId || !params?.secret) {
    redirect("/login?error=Invalid%20or%20expired%20reset%20link");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md overflow-hidden ring-0 shadow-[0_24px_64px_rgba(15,23,42,0.12)] rounded-2xl p-0 gap-0">
        <CardContent className="px-8 py-10 sm:px-10 sm:py-12">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <Image
              src="/logos/paperplane-logo.png"
              width={36}
              height={36}
              alt="Paperplane logo"
              unoptimized
            />
            <span className={`${griffy.className} text-xl text-slate-900`}>
              Paperplane
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Must be at least 8 characters.
          </p>

          {/* Alerts */}
          {params?.error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {params.error}
            </div>
          )}

          <form action={resetPassword} className="mt-8 space-y-5">
            {/* Pass token params as hidden fields */}
            <input type="hidden" name="userId" value={params.userId} />
            <input type="hidden" name="secret" value={params.secret} />

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <PasswordInput
                id="password"
                name="password"
                minLength={8}
                required
                placeholder="min 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                minLength={8}
                required
                placeholder="repeat your password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-orange-600 text-white font-semibold gap-2 shadow-[0_8px_24px_rgba(234,88,12,0.28)] hover:bg-orange-700 transition-colors"
            >
              Reset password
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
