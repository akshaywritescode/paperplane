"use client";

import { useTransition } from "react";
import { Monitor, Smartphone, Globe, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { revokeSession } from "../actions";
import { toast } from "sonner";

type SessionInfo = {
  $id: string;
  $createdAt: string;
  userId: string;
  expire: string;
  provider: string;
  ip: string;
  osName: string;
  clientType: string;
  clientName: string;
  deviceName: string;
  deviceBrand: string;
  countryName: string;
  current: boolean;
};

function DeviceIcon({ clientType }: { clientType: string }) {
  const type = clientType.toLowerCase();
  if (type.includes("mobile") || type.includes("phone")) {
    return <Smartphone className="size-4 text-muted-foreground" />;
  }
  return <Monitor className="size-4 text-muted-foreground" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SessionRow({ session }: { session: SessionInfo }) {
  const [isPending, startTransition] = useTransition();

  const clientLabel =
    [session.clientName, session.osName].filter(Boolean).join(" · ") || "Unknown browser";
  const locationLabel =
    [session.countryName, session.ip].filter(Boolean).join(" · ") || session.ip || "Unknown location";

  function handleRevoke() {
    startTransition(async () => {
      const res = await revokeSession(session.$id);
      if (res.success) {
        toast.success("Session revoked");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className={cn(
      "flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors",
      session.current && "border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/10",
    )}>
      {/* Icon */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <DeviceIcon clientType={session.clientType} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-medium text-foreground">
            {clientLabel}
          </p>
          {session.current && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
              <ShieldCheck className="size-2.5" />
              This device
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Globe className="size-3 shrink-0" />
          <span className="truncate">{locationLabel}</span>
          <span>·</span>
          <span className="shrink-0">{timeAgo(session.$createdAt)}</span>
        </div>
      </div>

      {/* Revoke */}
      {!session.current && (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isPending}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/20"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : "Revoke"}
        </button>
      )}
    </div>
  );
}

export function SessionList({ sessions }: { sessions: SessionInfo[] }) {
  if (sessions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No active sessions found.</p>
    );
  }

  // Current session first
  const sorted = [...sessions].sort((a, b) =>
    a.current === b.current ? 0 : a.current ? -1 : 1,
  );

  return (
    <div className="space-y-2">
      {sorted.map((session) => (
        <SessionRow key={session.$id} session={session} />
      ))}
    </div>
  );
}
