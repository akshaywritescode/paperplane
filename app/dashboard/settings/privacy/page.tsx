import { createAppwriteSessionClient } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { SettingsAlert } from "../components/SettingsAlert";
import { SessionList } from "./SessionList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

type PrivacyPageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) redirect("/login?error=Please%20log%20in%20first");

  const sessionList = await appwrite.account.listSessions();
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-12 py-2">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your active sessions and connected devices.
        </p>
      </div>

      <SettingsAlert error={params?.error} message={params?.message} />

      <section className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active sessions
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            These devices are currently signed in to your account. Revoke any session you don&apos;t recognise.
          </p>
        </div>
        <SessionList sessions={sessionList.sessions} />
      </section>
    </div>
  );
}
