"use client";

import { useState, useRef, useEffect } from "react";
import { Send, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HttpMethod } from "./index";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:     "text-emerald-600",
  POST:    "text-amber-500",
  PUT:     "text-blue-500",
  PATCH:   "text-violet-500",
  DELETE:  "text-red-500",
  HEAD:    "text-slate-500",
  OPTIONS: "text-slate-500",
};

type Props = {
  method: HttpMethod;
  url: string;
  loading: boolean;
  onMethodChange: (m: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
};

/**
 * Splits a URL into coloured segments matching the screenshot:
 * - scheme (https) → emerald
 * - separator (://) → muted
 * - host (domain.com) → sky
 * - path (/todos/1) → white/foreground
 * - query (?key=val) → amber
 */
function ColorizedUrl({ url }: { url: string }) {
  if (!url) return null;

  try {
    const hasProtocol = /^https?:\/\//i.test(url);
    const fullUrl = hasProtocol ? url : `https://${url}`;
    const parsed = new URL(fullUrl);

    const scheme = hasProtocol ? parsed.protocol.replace(":", "") : "";
    const sep    = hasProtocol ? "://" : "";
    const host   = parsed.hostname + (parsed.port ? `:${parsed.port}` : "");
    const path   = parsed.pathname !== "/" ? parsed.pathname : "/";

    // Parse query: key=value pairs with & separator in foreground
    const queryParts: React.ReactNode[] = [];
    if (parsed.search) {
      const raw = parsed.search.slice(1);
      queryParts.push(<span key="qmark" className="text-foreground">?</span>);
      raw.split("&").forEach((pair, i) => {
        if (i > 0) queryParts.push(<span key={`sep-${i}`} className="text-foreground">&amp;</span>);
        const eqIdx = pair.indexOf("=");
        if (eqIdx !== -1) {
          const k = pair.slice(0, eqIdx);
          const v = pair.slice(eqIdx + 1);
          queryParts.push(
            <span key={`pair-${i}`}>
              <span className="text-amber-400">{k}</span>
              <span className="text-foreground">=</span>
              <span className="text-amber-300">{v}</span>
            </span>
          );
        } else {
          queryParts.push(<span key={`pair-${i}`} className="text-amber-400">{pair}</span>);
        }
      });
    }

    return (
      <span className="font-mono text-sm pointer-events-none select-none">
        {scheme && <span className="text-emerald-500">{scheme}</span>}
        {sep    && <span className="text-slate-400">{sep}</span>}
        <span className="text-sky-400">{host}</span>
        {path  && <span className="text-foreground">{path}</span>}
        {queryParts}
      </span>
    );
  } catch {
    return (
      <span className="font-mono text-sm text-foreground pointer-events-none select-none">
        {url}
      </span>
    );
  }
}

export function UrlBar({ method, url, loading, onMethodChange, onUrlChange, onSend }: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      {/* Method picker */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs font-bold transition hover:bg-muted"
        >
          <span className={METHOD_COLORS[method]}>{method}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-32 rounded-lg border bg-popover p-1 shadow-md">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => { onMethodChange(m); setOpen(false); }}
                className={cn(
                  "flex w-full items-center rounded-md px-2.5 py-1.5 text-xs font-bold transition hover:bg-accent",
                  METHOD_COLORS[m],
                  m === method && "bg-accent",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* URL input with colorized overlay */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-md border bg-muted/30 px-3 py-1.5 transition",
          focused
            ? "border-orange-400 ring-2 ring-orange-400/20"
            : "border-border",
        )}
      >
        {/* Colorized display — hidden when focused so cursor is visible on plain input */}
        {!focused && url && (
          <div className="pointer-events-none absolute inset-0 flex items-center px-3 overflow-hidden whitespace-nowrap">
            <ColorizedUrl url={url} />
          </div>
        )}

        <input
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="https://api.example.com/endpoint"
          className={cn(
            "w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground",
            // Hide text colour when showing coloured overlay (not focused)
            !focused && url ? "text-transparent caret-foreground" : "text-foreground",
          )}
        />
      </div>

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={loading || !url.trim()}
        className="flex h-8 items-center gap-1.5 rounded-md bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Send className="size-3.5" />
            Send
          </>
        )}
      </button>
    </div>
  );
}
