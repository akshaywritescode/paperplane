import { createAppwriteSessionClient, getCurrentAppwriteUser } from "@/lib/appwrite/server";
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
  // No session at all → send to login
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  // Already fully authenticated → send to dashboard
  const user = await getCurrentAppwriteUser();
  if (user?.emailVerification) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  return <MfaForm error={params?.error} />;
}
