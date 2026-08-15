import { griffy } from "@/app/font";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { requestPasswordReset } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Paperplane account password.",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md overflow-hidden ring-0 shadow-[0_24px_64px_rgba(15,23,42,0.12)] rounded-2xl p-0 gap-0">
        <CardContent className="px-8 py-10 sm:px-10 sm:py-12">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <Image
              src="/logos/paperplane-logo-removebg-preview.png" className="logo-img"
              width={36}
              height={36}
              alt="Paperplane logo"
              unoptimized
            />
            <span className={`${griffy.className} text-xl text-foreground`}>
              Paperplane
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
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
          {params?.message && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {params.message}
            </div>
          )}

          <form action={requestPasswordReset} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="jane@company.com"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-orange-600 text-white font-semibold gap-2 shadow-[0_8px_24px_rgba(234,88,12,0.28)] hover:bg-orange-700 transition-colors"
            >
              Send reset link
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to log in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
