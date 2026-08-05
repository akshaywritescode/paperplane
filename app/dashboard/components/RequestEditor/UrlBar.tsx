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

export function UrlBar({ method, url, loading, onMethodChange, onUrlChange, onSend }: Props) {
  const [open, setOpen] = useState(false);
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

      {/* URL input */}
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 rounded-md border bg-muted/30 px-3 py-1.5 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition"
      />

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
