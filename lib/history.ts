/**
 * HistoryEntry type shared between server actions and client components.
 * Persistence is handled by Appwrite (see app/dashboard/history/actions.ts).
 */

import type { HttpMethod, ParamRow, HeaderRow } from "@/app/dashboard/components/RequestEditor";
import type { BodyConfig } from "@/app/dashboard/components/RequestEditor/body";
import type { AuthConfig } from "@/app/dashboard/components/RequestEditor/auth";

export type HistoryEntry = {
  id: string;                // Appwrite document $id
  timestamp: number;         // Date.now() at send-time
  title: string;             // Tab name ("" when untitled)
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
  source: "editor" | "repeater";
  response?: {
    statusCode: number;
    statusText: string;
    time: number;
    size: number;
    headers: Record<string, string>;
    cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
      expires?: string;
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string;
    }>;
    body: string;            // Full response body (capped at 500 KB server-side)
  };
};

/** Group entries by calendar date (Today / Yesterday / weekday label). */
export function groupByDate(
  entries: HistoryEntry[],
): { label: string; entries: HistoryEntry[] }[] {
  const groups = new Map<string, HistoryEntry[]>();
  const now = new Date();

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    let label: string;

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, now)) {
      label = "Today";
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      label = sameDay(d, yesterday)
        ? "Yesterday"
        : d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          });
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({
    label,
    entries,
  }));
}
