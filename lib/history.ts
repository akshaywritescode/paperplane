/**
 * Request History — persisted in localStorage.
 *
 * We keep the last MAX_ENTRIES entries in a single JSON array.
 * Each entry stores everything needed to restore the request AND
 * display a compact row in the history list.
 */

import type { HttpMethod } from "@/app/dashboard/components/RequestEditor";
import type { BodyConfig } from "@/app/dashboard/components/RequestEditor/body";
import type { AuthConfig } from "@/app/dashboard/components/RequestEditor/auth";
import type { ParamRow, HeaderRow } from "@/app/dashboard/components/RequestEditor";

export type HistoryEntry = {
  id: string;
  timestamp: number;           // Date.now()
  method: HttpMethod;
  url: string;                 // raw URL (without injected auth QP)
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
  // Response summary (undefined if request errored before a response)
  response?: {
    statusCode: number;
    statusText: string;
    time: number;
    size: number;
  };
};

const STORAGE_KEY = "paperplane_history_v1";
const MAX_ENTRIES = 500;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadHistory();
    const next: HistoryEntry[] = [
      { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
      ...existing,
    ].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function removeHistoryEntry(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

/** Group entries by calendar date (today / yesterday / date string) */
export function groupByDate(entries: HistoryEntry[]): { label: string; entries: HistoryEntry[] }[] {
  const groups = new Map<string, HistoryEntry[]>();
  const now = new Date();

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    let label: string;

    if (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    ) {
      label = "Today";
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
      ) {
        label = "Yesterday";
      } else {
        label = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      }
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
}
