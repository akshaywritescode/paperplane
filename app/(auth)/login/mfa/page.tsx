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
  // Must have an active (pre-MFA) session to be here
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  const params = await searchParams;
  return <MfaForm error={params?.error} />;
}
