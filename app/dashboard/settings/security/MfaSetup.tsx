"use client";

import { useState, useTransition } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import {
  setupTotp,
  verifyTotp,
  disableTotp,
  generateRecoveryCodes,
} from "../actions";
import { toast } from "sonner";

type Step = "idle" | "scan" | "verify" | "recovery";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? "Copied!" : "Copy code"}
    </button>
  );
}

export function MfaSetup({ mfaEnabled }: { mfaEnabled: boolean }) {
  const [step, setStep] = useState<Step>("idle");
  const [setupData, setSetupData] = useState<{ uri: string; secret: string } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Setup TOTP ──
  function handleSetup() {
    startTransition(async () => {
      const res = await setupTotp();
      if (res.success && res.uri) {
        setSetupData({ uri: res.uri, secret: res.secret! });
        setStep("scan");
      } else {
        toast.error(res.message ?? "Unable to start setup");
      }
    });
  }

  // ── Verify TOTP ──
  async function handleVerify(code: string) {
    if (code.length !== 6) return;
    const fd = new FormData();
    fd.set("code", code);
    startTransition(async () => {
      try {
        await verifyTotp(fd);
        // redirect fires on success — if we reach here something went wrong
      } catch {
        // redirect throws — expected on success
        toast.success("2FA enabled successfully!");
      }
    });
  }

  // ── Generate recovery codes ──
  function handleGenerateCodes() {
    startTransition(async () => {
      const res = await generateRecoveryCodes();
      if (res.success && res.codes) {
        setRecoveryCodes(res.codes);
        setStep("recovery");
      } else {
        toast.error(res.message ?? "Unable to generate recovery codes");
      }
    });
  }

  // ── Download recovery codes ──
  function downloadCodes() {
    const text = recoveryCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paperplane-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Enabled state ──
  if (mfaEnabled && step === "idle") {
    return (
      <div className="space-y-5">
        {/* Status */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Two-factor authentication is enabled
            </p>
            <p className="mt-0.5 text-xs text-emerald-700/70 dark:text-emerald-400/70">
              Your account is protected with an authenticator app.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleGenerateCodes}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Regenerate recovery codes
          </Button>

          <form action={disableTotp}>
            <Button variant="destructive" type="submit" className="gap-2">
              <X className="size-4" />
              Disable 2FA
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Recovery codes view ──
  if (step === "recovery") {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Save your recovery codes</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            If you lose access to your authenticator app, you can log in with these codes.
            Each code can only be used once.
          </p>
        </div>

        {/* Codes grid */}
        <div className="rounded-xl border bg-muted/30 p-5">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
            {recoveryCodes.map((code, i) => (
              <div
                key={i}
                className="rounded-lg border bg-background px-3 py-2 text-center text-xs font-medium tracking-wide"
              >
                {code}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(recoveryCodes.join("\n")).then(() => toast.success("Codes copied"))}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3.5" /> Copy
          </button>
          <button
            type="button"
            onClick={downloadCodes}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Download className="size-3.5" /> Download
          </button>
          <button
            type="button"
            onClick={handleGenerateCodes}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className="size-3.5" /> Regenerate
          </button>
          <Button size="sm" onClick={() => setStep("idle")} className="ml-auto bg-orange-600 text-white hover:bg-orange-700">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // ── Scan step ──
  if (step === "scan" && setupData) {
    return (
      <div className="space-y-6">
        {/* Step 1 header */}
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900/40">
            1
          </span>
          <h3 className="text-sm font-semibold text-foreground">Scan QR code</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">
          Scan the QR code below or manually enter the secret key into your authenticator app.
        </p>

        {/* QR + secret */}
        <div className="flex gap-5 rounded-xl border bg-muted/20 p-5 overflow-hidden">
          {/* QR */}
          <div className="flex size-36 shrink-0 items-center justify-center rounded-xl bg-white p-2 dark:bg-white">
            <QRCode value={setupData.uri} size={120} />
          </div>

          {/* Can't scan */}
          <div className="flex min-w-0 flex-col justify-center gap-3">
            <p className="text-sm font-medium text-foreground">Can't scan QR code?</p>
            <p className="text-xs text-muted-foreground">Enter this secret instead:</p>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-foreground">
                {showSecret ? setupData.secret : "••••••••••••••••"}
              </code>
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition"
              >
                {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {showSecret && <CopyButton text={setupData.secret} />}
          </div>
        </div>

        {/* Divider to step 2 */}
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 dark:bg-orange-900/40">
            2
          </span>
          <h3 className="text-sm font-semibold text-foreground">Enter verification code</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-4">
          Enter the 6-digit code you see in your authenticator app.
        </p>

        {/* OTP input */}
        <div className="flex flex-col gap-4">
          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={setOtpValue}
            onComplete={handleVerify}
            disabled={isPending}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="size-11 rounded-lg border-slate-200 text-base font-semibold first:rounded-lg first:border last:rounded-lg last:border data-[active=true]:border-orange-500 data-[active=true]:ring-2 data-[active=true]:ring-orange-500/20"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStep("idle"); setSetupData(null); setOtpValue(""); }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleVerify(otpValue)}
              disabled={otpValue.length !== 6 || isPending}
              className="bg-orange-600 text-white hover:bg-orange-700 gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle / not enabled ──
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
        <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Two-factor authentication is not enabled
          </p>
          <p className="mt-0.5 text-xs text-amber-700/70 dark:text-amber-400/70">
            Add an extra layer of security to your account.
          </p>
        </div>
      </div>

      <Button
        onClick={handleSetup}
        disabled={isPending}
        className="gap-2 bg-orange-600 text-white hover:bg-orange-700"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
        Set up authenticator app
      </Button>
    </div>
  );
}
