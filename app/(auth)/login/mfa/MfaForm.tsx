"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyLoginMfa, cancelMfaLogin } from "./actions";

type Props = { error?: string };

export function MfaForm({ error: initialError }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleComplete(otp: string) {
    if (otp.length !== 6) return;
    setError("");
    const fd = new FormData();
    fd.set("code", otp);
    startTransition(async () => {
      try {
        const result = await verifyLoginMfa(fd);
        // Only reached if redirect didn't fire (i.e. error returned)
        if (!result.success) {
          setError(result.message);
          setValue("");
        }
      } catch {
        // redirect throws — this is expected on success, do nothing
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelMfaLogin();
      router.push("/login");
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
          {/* Top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-orange-400" />

          <div className="px-10 py-12">
            {/* Icon */}
            <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl bg-orange-50 ring-1 ring-orange-100">
              <Shield className="size-8 text-orange-600" />
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
              Two-Factor Authentication
            </h1>
            <p className="mt-2 text-center text-sm text-slate-500">
              Enter the 6-digit code from your authenticator app.
            </p>

            {/* OTP input */}
            <div className="mt-10 flex flex-col items-center gap-6">
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
                      className="size-12 rounded-xl border-slate-200 text-base font-semibold first:rounded-xl first:border last:rounded-xl last:border data-[active=true]:border-orange-500 data-[active=true]:ring-orange-500/20"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={() => handleComplete(value)}
                disabled={value.length !== 6 || isPending}
                className="w-full h-11 rounded-xl bg-orange-600 font-semibold text-white shadow-[0_8px_24px_rgba(234,88,12,0.28)] hover:bg-orange-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>

            {/* Helper text */}
            <p className="mt-6 text-center text-xs text-slate-400">
              The code refreshes every 30 seconds. Make sure your device time is synced.
            </p>
          </div>

          {/* Footer */}
          <div className="border-t bg-slate-50 px-10 py-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
            >
              <ArrowLeft className="size-3.5" />
              Cancel and return to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
