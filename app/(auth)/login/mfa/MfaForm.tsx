"use client";

import { useState, useTransition } from "react";
import { griffy } from "@/app/font";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { verifyLoginMfa, cancelMfaLogin } from "./actions";

const trustedBrands = [
  { name: "ClickUp", src: "/logos/clickup-wordmark.svg" },
  { name: "Trello", src: "/logos/trello-wordmark.svg" },
  { name: "Proton Mail", src: "/logos/protonmail-wordmark.svg" },
  { name: "MongoDB", src: "/logos/mongodb-wordmark-light.svg" },
];

type Props = { error?: string };

export function MfaForm({ error: initialError }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();

  async function handleComplete(otp: string) {
    if (otp.length !== 6) return;
    setError("");
    const fd = new FormData();
    fd.set("code", otp);
    startTransition(async () => {
      try {
        const result = await verifyLoginMfa(fd);
        if (!result.success) {
          setError(result.message);
          setValue("");
        }
      } catch {
        // redirect throws on success — expected
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-5xl overflow-hidden ring-0 shadow-[0_24px_64px_rgba(15,23,42,0.12)] rounded-2xl p-0 gap-0">
        <div className="grid lg:grid-cols-2">

          {/* ── Left: form ── */}
          <CardContent className="flex flex-col justify-between px-8 py-10 sm:px-10 sm:py-12">
            <div>
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

              {/* Shield icon */}
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-orange-50 ring-1 ring-orange-100">
                <Shield className="size-6 text-orange-600" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Two-factor authentication
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter the 6-digit code from your authenticator app.
              </p>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* OTP */}
              <div className="mt-8 flex flex-col gap-5">
                <InputOTP
                  maxLength={6}
                  value={value}
                  onChange={setValue}
                  onComplete={handleComplete}
                  disabled={isPending}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="size-12 rounded-lg border-slate-200 text-base font-semibold first:rounded-lg first:border last:rounded-lg last:border data-[active=true]:border-orange-500 data-[active=true]:ring-2 data-[active=true]:ring-orange-500/20"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <p className="text-xs text-slate-400">
                  Code refreshes every 30 seconds. Ensure your device clock is synced.
                </p>

                <Button
                  onClick={() => handleComplete(value)}
                  disabled={value.length !== 6 || isPending}
                  className="w-full h-11 rounded-xl bg-orange-600 text-white font-semibold shadow-[0_8px_24px_rgba(234,88,12,0.28)] hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {isPending
                    ? <Loader2 className="size-4 animate-spin" />
                    : "Verify code"
                  }
                </Button>
              </div>
            </div>

            {/* Cancel */}
            <form action={cancelMfaLogin} className="mt-8 text-center">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to log in
              </button>
            </form>
          </CardContent>

          {/* ── Right: brand panel ── */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-r-2xl bg-orange-600 px-10 py-12">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-orange-400/30 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-orange-800/30 blur-3xl" />

            <div className="relative z-10">
              <h2 className={`${griffy.className} text-3xl font-normal leading-snug text-white`}>
                Let your API
                <br />
                take flight
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-orange-100/90">
                Compose requests, inspect responses, and organize API workflows
                in a calm workspace built for modern teams.
              </p>
            </div>

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
                  <div key={stat.label} className="rounded-lg bg-white/10 px-3.5 py-3">
                    <p className="text-[10px] font-medium text-orange-100/70 uppercase tracking-wide">{stat.label}</p>
                    <p className="mt-0.5 text-lg font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {[
                  { method: "GET", path: "/api/users", status: "200" },
                  { method: "POST", path: "/api/orders", status: "201" },
                  { method: "DELETE", path: "/api/session", status: "204" },
                ].map((row) => (
                  <div key={row.path} className="flex items-center justify-between rounded-md bg-white/10 px-3 py-1.5 text-xs font-mono text-white/80">
                    <span className="font-bold text-white">{row.method}</span>
                    <span className="flex-1 px-3 truncate">{row.path}</span>
                    <span className="text-green-300">{row.status}</span>
                  </div>
                ))}
              </div>
            </div>

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
