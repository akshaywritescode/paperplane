"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ShieldAlert, Key } from "lucide-react";
import { setupTotp, verifyTotp, disableTotp, generateRecoveryCodes } from "../actions";
import { toast } from "sonner";

export function MfaSetup({ mfaEnabled }: { mfaEnabled: boolean }) {
  const [setupData, setSetupData] = useState<{ uri: string; secret: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    const res = await setupTotp();
    if (res.success && res.uri) {
      setSetupData({ uri: res.uri, secret: res.secret! });
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  const handleGenerateCodes = async () => {
    setIsLoading(true);
    const res = await generateRecoveryCodes();
    if (res.success && res.codes) {
      setRecoveryCodes(res.codes);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  if (mfaEnabled) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            Two-Factor Authentication is currently enabled.
          </p>
        </div>

        <div className="flex gap-3">
          <form action={disableTotp}>
            <Button variant="destructive">Disable 2FA</Button>
          </form>
          <Button variant="outline" onClick={handleGenerateCodes} disabled={isLoading}>
            <Key className="mr-2 size-4" />
            Generate Recovery Codes
          </Button>
        </div>

        {recoveryCodes.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-semibold">Save these recovery codes securely</h4>
            <p className="mb-4 text-xs text-muted-foreground">
              These codes can be used to access your account if you lose your authenticator device.
              Each code can only be used once.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="rounded border bg-background px-2 py-1 text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-sm font-semibold">1. Scan the QR code</h4>
          <p className="mb-4 text-sm text-muted-foreground">
            Use an authenticator app like Google Authenticator or Authy to scan this code.
          </p>
          <div className="flex justify-center rounded-lg bg-white p-4">
            <QRCode value={setupData.uri} size={150} />
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Manual entry secret: <span className="font-mono text-foreground">{setupData.secret}</span>
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="mb-4 text-sm font-semibold">2. Verify the code</h4>
          <form action={verifyTotp} className="flex gap-2">
            <Input name="code" placeholder="6-digit code" maxLength={6} required className="max-w-[200px]" />
            <Button type="submit">Verify & Enable</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
          Two-Factor Authentication is not enabled.
        </p>
      </div>
      <Button onClick={handleSetup} disabled={isLoading}>
        Set up Authenticator App
      </Button>
    </div>
  );
}
