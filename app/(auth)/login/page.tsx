import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { griffy } from "@/app/font";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { logIn, logInWithOAuth } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Paperplane account to start testing APIs.",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
};

const trustedBrands = [
  { name: "ClickUp", src: "/logos/clickup-wordmark.svg" },
  { name: "Trello", src: "/logos/trello-wordmark.svg" },
  { name: "Proton Mail", src: "/logos/protonmail-wordmark.svg" },
  { name: "MongoDB", src: "/logos/mongodb-wordmark-light.svg" },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentAppwriteUser();

  if (user?.emailVerification) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-5xl overflow-hidden ring-0 shadow-[0_24px_64px_rgba(15,23,42,0.12)] rounded-2xl p-0 gap-0">
        <div className="grid lg:grid-cols-2">

          {/* ── Left: form ── */}
          <CardContent className="flex flex-col justify-between px-8 py-10 sm:px-10 sm:py-12">
            <div>
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
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Log in to continue to Paperplane.
              </p>

              {/* OAuth buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <form action={logInWithOAuth}>
                  <input type="hidden" name="provider" value="google" />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Log in with Google
                  </button>
                </form>

                <form action={logInWithOAuth}>
                  <input type="hidden" name="provider" value="github" />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-foreground" aria-hidden="true">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    Log in with GitHub
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="relative my-6 flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="mx-4 text-xs font-medium text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Alerts */}
              {params?.error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {params.error}
                </div>
              )}
              {params?.message && (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {params.message}
                </div>
              )}

              {/* Form */}
              <form action={logIn} className="space-y-5">
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
  className="px-3.5 py-2.5 text-sm"
/>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    name="password"
                    required
                    placeholder="••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-orange-600 text-white font-semibold gap-2 shadow-[0_8px_24px_rgba(234,88,12,0.28)] hover:bg-orange-700 transition-colors"
                >
                  Log in
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardContent>

          {/* ── Right: brand panel ── */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-r-2xl bg-orange-600 px-10 py-12">
            {/* Decorative glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-orange-400/30 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-orange-800/30 blur-3xl"
            />

            <div className="relative z-10">
              <h2
                className={`${griffy.className} text-3xl font-normal leading-snug text-white`}
              >
                Let your API
                <br />
                take flight
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-orange-100/90">
                Compose requests, inspect responses, and organize API workflows
                in a calm workspace built for modern teams.
              </p>
            </div>

            {/* Mock dashboard card */}
            <div className="relative z-10 my-8 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-2.5 rounded-full bg-white/40" />
                <div className="h-2 w-24 rounded-full bg-white/40" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Requests today", value: "1,248" },
                  { label: "Avg. latency", value: "142 ms" },
                  { label: "Success rate", value: "99.4%" },
                  { label: "Environments", value: "3" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-white/10 px-3.5 py-3"
                  >
                    <p className="text-[10px] font-medium text-orange-100/70 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {[
                  { method: "GET", path: "/api/users", status: "200" },
                  { method: "POST", path: "/api/orders", status: "201" },
                  { method: "DELETE", path: "/api/session", status: "204" },
                ].map((row) => (
                  <div
                    key={row.path}
                    className="flex items-center justify-between rounded-md bg-white/10 px-3 py-1.5 text-xs font-mono text-white/80"
                  >
                    <span className="font-bold text-white">{row.method}</span>
                    <span className="flex-1 px-3 truncate">{row.path}</span>
                    <span className="text-green-300">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand logos */}
            <div className="relative z-10">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-orange-200/70">
                Trusted by teams at
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {trustedBrands.map((brand) => (
                  <Image
                    key={brand.name}
                    src={brand.src}
                    width={80}
                    height={20}
                    alt={`${brand.name} logo`}
                    className="max-h-5 w-auto object-contain brightness-0 invert opacity-70"
                    unoptimized
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </Card>
    </main>
  );
}
