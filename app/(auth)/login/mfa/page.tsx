import { createAppwriteSessionClient } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { MfaForm } from "./MfaForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Authentication",
  robots: { index: false, follow: false },
};

type MfaPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function MfaPage({ searchParams }: MfaPageProps) {
  const appwrite = await createAppwriteSessionClient();

  // No session cookie at all → go to login
  if (!appwrite) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  // Try to get the user — three outcomes:
  // 1. Throws user_more_factors_required → MFA pending, show the form ✓
  // 2. Returns user with emailVerification true → already fully authed → dashboard
  // 3. Returns null / other error → invalid session → go to login
  let needsMfa = false;
  let isFullyAuthed = false;

  try {
    const user = await appwrite.account.get();
    // If we get here, session is fully valid
    if (user.emailVerification) {
      isFullyAuthed = true;
    }
  } catch (err: any) {
    if (err?.type === "user_more_factors_required") {
      needsMfa = true;
    } else {
      // Invalid or expired session
      redirect("/login?error=Please%20log%20in%20first");
    }
  }

  if (isFullyAuthed) {
    redirect("/dashboard");
  }

  if (!needsMfa) {
    // Edge case: session exists, no MFA required, but not fully authed
    redirect("/login");
  }

  const params = await searchParams;
  return <MfaForm error={params?.error} />;
}
