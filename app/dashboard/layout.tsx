import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { RepeaterProvider } from "./context/RepeaterContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Paperplane API workspace.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAppwriteUser();

  if (!user) {
    redirect("/login?error=Please%20log%20in%20first");
  }

  if (!user.emailVerification) {
    redirect("/signup?error=Please%20verify%20your%20email%20first");
  }

  return (
    <RepeaterProvider>
    <div className="flex h-svh w-full overflow-hidden">
      <SidebarProvider style={{ "--sidebar-width": "13rem" } as React.CSSProperties}>
        <AppSidebar user={{ name: user.name, email: user.email }} />
        <SidebarInset className="flex flex-col overflow-hidden">
          {/* ── Top bar ── */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>

          {/* ── Page content ── */}
          <div className="flex flex-1 overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
    </RepeaterProvider>
  );
}
