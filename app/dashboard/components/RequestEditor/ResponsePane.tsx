"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, AlertCircle, MoreVertical, Copy, ListFilter, Download, Trash2, ChevronsUpDown, Check, WrapText, Cookie, ArrowRight, AlertTriangle } from "lucide-react";
import { SiCss, SiHtml5, SiJavascript, SiJson, SiXml } from "@icons-pack/react-simple-icons";
import { cn } from "@/lib/utils";
import { CodeBlock, detectLang } from "./CodeBlock";
import { SearchBar, HighlightedText } from "./SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ResponseState } from "./index";

type Lang = "json" | "html" | "xml" | "text" | "css" | "javascript";

const LANG_ICONS: Record<Lang, React.ReactNode> = {
  json:       <SiJson       className="size-3.5 shrink-0" />,
  html:       <SiHtml5      className="size-3.5 shrink-0" />,
  xml:        <SiXml        className="size-3.5 shrink-0" />,
  css:        <SiCss        className="size-3.5 shrink-0" />,
  javascript: <SiJavascript className="size-3.5 shrink-0" />,
  text: (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M3 5h10M3 8h7M3 11h5"/>
    </svg>
  ),
};

const LANGS: { value: Lang; label: string }[] = [
  { value: "json",       label: "JSON"       },
  { value: "html",       label: "HTML"       },
  { value: "xml",        label: "XML"        },
  { value: "css",        label: "CSS"        },
  { value: "javascript", label: "JavaScript" },
  { value: "text",       label: "Text"       },
];

type Tab = "response" | "headers" | "cookies" | "redirects";

const STATUS_COLORS: Record<string, string> = {
  "1": "text-slate-500 bg-slate-100",
  "2": "text-emerald-700 bg-emerald-100",
  "3": "text-blue-700 bg-blue-100",
  "4": "text-amber-700 bg-amber-100",
  "5": "text-red-700 bg-red-100",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResponsePane({ response, onClear, url = "" }: { response: ResponseState; onClear: () => void; url?: string }) {
  const [tab, setTab] = useState<Tab>("response");
  const [lang, setLang] = useState<Lang>("text");
  const [wordWrap, setWordWrap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCurrent, setSearchCurrent] = useState(0);

  // Auto-detect language whenever a new response arrives
  useEffect(() => {
    if (response.status === "done") {
      const ct = response.headers["content-type"] ?? "";
      setLang(detectLang(response.body, ct));
    }
  }, [response]);

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
    if (tab === "cookies") {
      return response.cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("\n");
    }
    if (tab === "redirects") {
      return response.redirects
        ?.map((r) => `${r.statusCode} ${r.statusText} → ${r.location}`)
        .join("\n") || "";
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
            {(["response", "headers", "cookies", "redirects"] as Tab[])
              .filter((t) => t !== "redirects" || (response.redirects && response.redirects.length > 0))
              .map((t) => (
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
                {t === "redirects" && response.redirects && (
                  <span className="ml-1.5 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                    {response.redirects.length}
                  </span>
                )}
              </button>
            ))}

            {/* Language selector — only relevant on response tab */}
            {tab === "response" && (
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-2 flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted outline-none">
                  {LANGS.find((l) => l.value === lang)?.label ?? "Auto"}
                  {LANG_ICONS[lang]}
                  <ChevronsUpDown className="size-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="w-36">
                  {LANGS.map((l) => (
                    <DropdownMenuItem
                      key={l.value}
                      onClick={() => setLang(l.value)}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        {LANG_ICONS[l.value]}
                        {l.label}
                      </span>
                      {lang === l.value && <Check className="size-3.5 text-orange-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Word wrap toggle — only on response tab */}
            {tab === "response" && (
              <button
                onClick={() => setWordWrap((v) => !v)}
                aria-label="Toggle word wrap"
                title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
                className={cn(
                  "ml-1 flex size-7 items-center justify-center rounded-md transition-colors",
                  wordWrap
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <WrapText className="size-4" />
              </button>
            )}

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

      {/* Truncation warning banner */}
      {response.status === "done" && response.truncated && (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
          <span>
            Response truncated at <strong>5 MB</strong>. Full response was{" "}
            <strong>{formatSize(response.fullSize ?? response.size)}</strong>. Use{" "}
            <button
              onClick={downloadResponse}
              className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              Download Response
            </button>{" "}
            to save the complete body.
          </span>
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
            lang={lang}
            searchQuery={searchQuery}
            searchCurrent={searchCurrent}
            wordWrap={wordWrap}
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

        {response.status === "done" && tab === "cookies" && (
          <div className="flex-1 overflow-auto">
            {response.cookies.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground py-12">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <Cookie className="size-7" />
                </div>
                <p className="text-sm font-medium">No cookies</p>
                <p className="text-xs">This response doesn't contain any Set-Cookie headers</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {response.cookies.map((cookie, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-muted/30 p-3 text-xs"
                  >
                    {/* Cookie name and value */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-1">
                          <HighlightedText
                            text={cookie.name}
                            query={searchQuery}
                            current={-1}
                          />
                        </div>
                        <div className="font-mono text-muted-foreground break-all">
                          <HighlightedText
                            text={cookie.value}
                            query={searchQuery}
                            current={-1}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${cookie.name}=${cookie.value}`);
                        }}
                        className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Copy cookie"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>

                    {/* Cookie attributes */}
                    {(cookie.domain || cookie.path || cookie.expires || cookie.maxAge !== undefined || cookie.httpOnly || cookie.secure || cookie.sameSite) && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/50 pt-2.5">
                        {cookie.domain && (
                          <>
                            <span className="text-muted-foreground">Domain:</span>
                            <span className="font-mono text-foreground">{cookie.domain}</span>
                          </>
                        )}
                        {cookie.path && (
                          <>
                            <span className="text-muted-foreground">Path:</span>
                            <span className="font-mono text-foreground">{cookie.path}</span>
                          </>
                        )}
                        {cookie.expires && (
                          <>
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="font-mono text-foreground">{cookie.expires}</span>
                          </>
                        )}
                        {cookie.maxAge !== undefined && (
                          <>
                            <span className="text-muted-foreground">Max-Age:</span>
                            <span className="font-mono text-foreground">{cookie.maxAge}s</span>
                          </>
                        )}
                        {cookie.sameSite && (
                          <>
                            <span className="text-muted-foreground">SameSite:</span>
                            <span className="font-mono text-foreground">{cookie.sameSite}</span>
                          </>
                        )}
                        {(cookie.httpOnly || cookie.secure) && (
                          <>
                            <span className="text-muted-foreground">Flags:</span>
                            <span className="flex gap-2">
                              {cookie.httpOnly && (
                                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                  HttpOnly
                                </span>
                              )}
                              {cookie.secure && (
                                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                                  Secure
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {response.status === "done" && tab === "redirects" && (
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <div className="mb-4 text-xs text-muted-foreground">
                This request followed <span className="font-semibold text-foreground">{response.redirects?.length || 0}</span> redirect{response.redirects && response.redirects.length !== 1 ? 's' : ''} before reaching the final response.
              </div>
              
              {/* Redirect chain visualization */}
              <div className="space-y-3">
                {response.redirects?.map((redirect, idx) => (
                  <div key={idx}>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      {/* Status and hop number */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            HOP {idx + 1}
                          </span>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-bold",
                              STATUS_COLORS[String(redirect.statusCode)[0]] ?? "text-slate-700 bg-slate-100",
                            )}
                          >
                            {redirect.statusCode} {redirect.statusText}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(redirect.location);
                          }}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Copy location"
                          title="Copy location URL"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>

                      {/* Location URL */}
                      <div className="mb-2">
                        <div className="text-[10px] font-medium text-muted-foreground mb-1">Location:</div>
                        <div className="font-mono text-xs text-foreground break-all bg-background/50 rounded px-2 py-1.5">
                          {redirect.location}
                        </div>
                      </div>

                      {/* Headers (collapsed by default, expandable if needed) */}
                      {Object.keys(redirect.headers).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[10px] font-medium text-muted-foreground hover:text-foreground select-none">
                            Headers ({Object.keys(redirect.headers).length})
                          </summary>
                          <div className="mt-2 space-y-1 pl-2">
                            {Object.entries(redirect.headers).map(([k, v]) => (
                              <div key={k} className="grid grid-cols-[8rem_1fr] gap-2 text-[11px]">
                                <span className="font-medium text-muted-foreground truncate">{k}:</span>
                                <span className="font-mono text-foreground break-all">{v}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>

                    {/* Arrow between redirects */}
                    {idx < (response.redirects?.length || 0) - 1 && (
                      <div className="flex items-center justify-center py-2">
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Final response indicator */}
                {response.redirects && response.redirects.length > 0 && (
                  <>
                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">
                          FINAL RESPONSE
                        </span>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-bold",
                            STATUS_COLORS[String(response.statusCode)[0]] ?? "text-slate-700 bg-slate-100",
                          )}
                        >
                          {response.statusCode} {response.statusText}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-green-700 dark:text-green-400">
                        The redirect chain ended here. Response body and headers are shown in the Response and Headers tabs.
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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
