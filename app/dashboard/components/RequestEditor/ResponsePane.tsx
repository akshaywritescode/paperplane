"use client";

import { useState } from "react";
import { FileText, Loader2, AlertCircle, MoreVertical, Copy, ListFilter, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";
import { SearchBar, HighlightedText } from "./SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ResponseState } from "./index";

type Tab = "response" | "headers";

const STATUS_COLORS: Record<string, string> = {
  "1": "text-slate-500 bg-slate-100",
  "2": "text-emerald-700 bg-emerald-100",
  "3": "text-blue-700 bg-blue-100",
  "4": "text-amber-700 bg-amber-100",
  "5": "text-red-700 bg-red-100",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ResponsePane({ response, onClear, url = "" }: { response: ResponseState; onClear: () => void; url?: string }) {
  const [tab, setTab] = useState<Tab>("response");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCurrent, setSearchCurrent] = useState(0);

  function downloadResponse() {
    if (response.status !== "done") return;

    // Detect extension from content-type header
    const ct = response.headers["content-type"] ?? "";
    let ext = "txt";
    if (ct.includes("json")) ext = "json";
    else if (ct.includes("html")) ext = "html";
    else if (ct.includes("xml")) ext = "xml";
    else if (ct.includes("csv")) ext = "csv";
    else if (ct.includes("javascript")) ext = "js";
    else if (ct.includes("css")) ext = "css";
    else if (ct.includes("plain")) ext = "txt";

    // Build filename: [datetime]-[subdomain-domain-tld-path].ext
    const now = new Date();
    const datetime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

    let urlPart = "response";
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      const parsed = new URL(fullUrl);
      // host: subdomain.domain.tld → replace dots with hyphens
      const hostPart = parsed.hostname.replace(/\./g, "-");
      // path: /foo/bar → foo-bar (strip leading slash, replace / with -)
      const pathPart = parsed.pathname.replace(/^\//, "").replace(/\//g, "-") || "";
      urlPart = pathPart ? `${hostPart}-${pathPart}` : hostPart;
    } catch { /* keep default */ }

    const filename = `${datetime}-${urlPart}.${ext}`;

    const blob = new Blob([response.body], { type: ct || "text/plain" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  }

  function getSearchContent(): string {
    if (response.status !== "done") return "";
    if (tab === "response") return response.body;
    if (tab === "headers") {
      return Object.entries(response.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
    }
    return "";
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Status bar */}
      {response.status === "done" && (
        <div className="flex h-10 shrink-0 items-center gap-3 border-b px-4">
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-bold",
              STATUS_COLORS[String(response.statusCode)[0]] ?? "text-slate-700 bg-slate-100",
            )}
          >
            {response.statusCode} {response.statusText}
          </span>
          <span className="text-xs text-muted-foreground">{response.time} ms</span>
          <span className="text-xs text-muted-foreground">{formatSize(response.size)}</span>

          <div className="ml-auto flex items-center">
            {(["response", "headers"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-10 px-3 text-xs font-medium capitalize transition-colors border-b-2",
                  tab === t
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none">
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="w-52">
                <DropdownMenuItem className="flex items-center justify-between text-xs" onClick={() => {
                  if (response.status !== "done") return;
                  const headers = Object.entries(response.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n");
                  navigator.clipboard.writeText(`${headers}\n\n${response.body}`);
                }}>
                  Copy All <Copy className="size-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between text-xs" onClick={() => {
                  if (response.status !== "done") return;
                  const text = Object.entries(response.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n");
                  navigator.clipboard.writeText(text);
                }}>
                  Copy Headers <ListFilter className="size-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between text-xs" onClick={() => {
                  if (response.status !== "done") return;
                  navigator.clipboard.writeText(response.body);
                }}>
                  Copy Body <FileText className="size-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between text-xs" onClick={downloadResponse}>
                  Download Response <Download className="size-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between text-xs text-destructive" onClick={onClear}>
                  Clear Response <Trash2 className="size-3.5" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-auto">
        {response.status === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <FileText className="size-7" />
            </div>
            <p className="text-sm font-medium">Not sent</p>
            <p className="text-xs">Enter a URL and hit Send</p>
          </div>
        )}

        {response.status === "loading" && (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}

        {response.status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-destructive">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-7" />
            </div>
            <p className="text-sm font-medium">Request failed</p>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              {response.message}
            </p>
          </div>
        )}

        {response.status === "done" && tab === "response" && (
          <CodeBlock
            code={response.body}
            searchQuery={searchQuery}
            searchCurrent={searchCurrent}
          />
        )}

        {response.status === "done" && tab === "headers" && (
          <div className="flex-1 overflow-auto">
            {Object.entries(response.headers).map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[12rem_1fr] border-b px-4 py-2 text-xs hover:bg-muted/30"
              >
                <span className="font-medium text-muted-foreground truncate pr-3">
                  <HighlightedText
                    text={k}
                    query={searchQuery}
                    current={-1}
                  />
                </span>
                <span className="font-mono text-foreground break-all">
                  <HighlightedText
                    text={v}
                    query={searchQuery}
                    current={-1}
                  />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search bar */}
      <SearchBar
        content={getSearchContent()}
        onQueryChange={setSearchQuery}
        onCurrentChange={setSearchCurrent}
      />
    </div>
  );
}
