"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Search,
  Trash2,
  RotateCw,
  ChevronDown,
  ChevronRight,
  X,
  Filter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { groupByDate } from "@/lib/history";
import type { HistoryEntry } from "@/lib/history";
import { deleteHistoryEntryAction, clearHistoryAction } from "./actions";

const METHOD_COLORS: Record<string, string> = {
  GET:     "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50",
  POST:    "text-amber-700   bg-amber-100   dark:text-amber-400   dark:bg-amber-950/50",
  PUT:     "text-blue-700    bg-blue-100    dark:text-blue-400    dark:bg-blue-950/50",
  PATCH:   "text-violet-700  bg-violet-100  dark:text-violet-400  dark:bg-violet-950/50",
  DELETE:  "text-red-700     bg-red-100     dark:text-red-400     dark:bg-red-950/50",
  HEAD:    "text-slate-600   bg-slate-100   dark:text-slate-400   dark:bg-slate-800/50",
  OPTIONS: "text-slate-600   bg-slate-100   dark:text-slate-400   dark:bg-slate-800/50",
};

const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-600 dark:text-emerald-400",
  "3": "text-blue-600    dark:text-blue-400",
  "4": "text-amber-600   dark:text-amber-400",
  "5": "text-red-600     dark:text-red-400",
};

const ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function HistoryView({
  initialEntries,
}: {
  initialEntries: HistoryEntry[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.url.toLowerCase().includes(q) || e.method.toLowerCase().includes(q) || e.title.toLowerCase().includes(q);
    const matchMethod = methodFilter.length === 0 || methodFilter.includes(e.method);
    return matchSearch && matchMethod;
  });

  const groups = groupByDate(filtered);

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function toggleMethodFilter(method: string) {
    setMethodFilter((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    startTransition(() => deleteHistoryEntryAction(id));
  }

  function handleClearAll() {
    setEntries([]);
    startTransition(() => clearHistoryAction());
  }

  /** Restore full request + response state into the editor */
  function handleRepeat(entry: HistoryEntry) {
    sessionStorage.setItem("paperplane_restore", JSON.stringify(entry));
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <Clock className="size-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold">History</h1>
        <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {entries.length}
        </span>
        {isPending && <Loader2 className="size-3 animate-spin text-muted-foreground" />}

        {/* Search */}
        <div className="ml-4 flex flex-1 max-w-sm items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search URL, method, or title…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Method filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition hover:bg-muted",
              methodFilter.length > 0
                ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                : "text-muted-foreground",
            )}
          >
            <Filter className="size-3" />
            {methodFilter.length > 0 ? methodFilter.join(", ") : "Filter"}
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border bg-popover p-1 shadow-md">
              {ALL_METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMethodFilter(m)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-bold transition hover:bg-accent",
                    METHOD_COLORS[m],
                  )}
                >
                  {m}
                  {methodFilter.includes(m) && <span className="text-orange-500">✓</span>}
                </button>
              ))}
              {methodFilter.length > 0 && (
                <button
                  onClick={() => { setMethodFilter([]); setFilterOpen(false); }}
                  className="mt-1 w-full rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent transition"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-auto">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Clock className="size-7" />
            </div>
            <p className="text-sm font-medium">No history yet</p>
            <p className="text-xs">Every request you send will appear here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No results for &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div>
            {groups.map(({ label, entries: groupEntries }) => (
              <div key={label}>
                {/* Date section header */}
                <button
                  onClick={() => toggleGroup(label)}
                  className="flex w-full items-center gap-2 bg-muted/40 px-4 py-2 text-left text-xs font-semibold text-muted-foreground hover:bg-muted/60 transition"
                >
                  {collapsedGroups.has(label) ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                  {label}
                  <span className="ml-auto font-normal">{groupEntries.length}</span>
                </button>

                {!collapsedGroups.has(label) &&
                  groupEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-center gap-3 border-b px-4 py-2.5 text-xs hover:bg-muted/30 transition"
                    >
                      {/* Method badge */}
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                          METHOD_COLORS[entry.method] ?? "text-slate-600 bg-slate-100",
                        )}
                      >
                        {entry.method}
                      </span>

                      {/* Title + URL */}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {entry.title && (
                          <span className="truncate font-medium text-foreground">
                            {entry.title}
                          </span>
                        )}
                        <span className="truncate font-mono text-muted-foreground">
                          {entry.url}
                        </span>
                      </div>

                      {/* Response summary */}
                      {entry.response ? (
                        <>
                          <span
                            className={cn(
                              "shrink-0 font-semibold",
                              STATUS_COLORS[String(entry.response.statusCode)[0]] ?? "text-slate-600",
                            )}
                          >
                            {entry.response.statusCode}
                          </span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {entry.response.time} ms
                          </span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {formatSize(entry.response.size)}
                          </span>
                        </>
                      ) : (
                        <span className="shrink-0 text-destructive">error</span>
                      )}

                      {/* Timestamp */}
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {formatTime(entry.timestamp)}
                      </span>

                      {/* Hover actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handleRepeat(entry)}
                          title="Repeat request — loads full request & response"
                          className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-950/40 dark:hover:text-orange-400"
                        >
                          <RotateCw className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          title="Remove from history"
                          className="flex size-6 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
