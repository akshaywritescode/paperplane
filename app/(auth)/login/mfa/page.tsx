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
  const params = await searchParams;
  return <MfaForm error={params?.error} />;
}
