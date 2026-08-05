import { SettingsNav } from "./components/SettingsNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-52 shrink-0 overflow-y-auto border-r bg-muted/20 px-4 py-6">
        <div>
          <h1 className="text-base font-semibold text-foreground">Settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your account and security.
          </p>
        </div>
        <SettingsNav />
      </aside>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
