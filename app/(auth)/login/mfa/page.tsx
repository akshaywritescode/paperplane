import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyLoginMfa, cancelMfaLogin } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Authentication",
};

type MfaPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <Shield className="size-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Two-Factor Authentication</h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      <div className="grid gap-6">
        <form action={verifyLoginMfa}>
          <div className="grid gap-4">
            <div className="grid gap-1">
              <label htmlFor="code" className="sr-only">
                Authentication Code
              </label>
              <Input
                id="code"
                name="code"
                placeholder="123456"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                required
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            {params?.error && (
              <div className="rounded bg-red-100 p-2 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                {params.error}
              </div>
            )}
            
            <Button type="submit" className="w-full">
              Verify
            </Button>
          </div>
        </form>

        <form action={cancelMfaLogin} className="px-8 text-center text-sm text-muted-foreground">
          <button type="submit" className="hover:text-primary underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer text-muted-foreground">
            Cancel and return to login
          </button>
        </form>
      </div>
    </div>
  );
}
