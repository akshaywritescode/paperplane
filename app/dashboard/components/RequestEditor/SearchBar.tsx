"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Plain text content to search within — provided by the parent */
  content: string;
  onQueryChange?: (q: string) => void;
  onCurrentChange?: (idx: number) => void;
  className?: string;
};

type Match = { start: number; end: number };

function findMatches(text: string, query: string): Match[] {
  if (!query.trim()) return [];
  const results: Match[] = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let idx = 0;
  while ((idx = lower.indexOf(q, idx)) !== -1) {
    results.push({ start: idx, end: idx + q.length });
    idx += q.length;
  }
  return results;
}

export function SearchBar({ content, onQueryChange, onCurrentChange, className }: Props) {
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = findMatches(content, query);
  const count = matches.length;

  useEffect(() => {
    setCurrent(0);
    onCurrentChange?.(0);
  }, [query, content]);

  function goNext() {
    if (count === 0) return;
    const next = (current + 1) % count;
    setCurrent(next);
    onCurrentChange?.(next);
  }

  function goPrev() {
    if (count === 0) return;
    const prev = (current - 1 + count) % count;
    setCurrent(prev);
    onCurrentChange?.(prev);
  }

  function handleQueryChange(q: string) {
    setQuery(q);
    onQueryChange?.(q);
  }

  function handleClear() {
    handleQueryChange("");
    inputRef.current?.focus();
  }

  const displayIndex = count > 0 ? current + 1 : 0;

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 border-t bg-muted/40 px-3",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />

      <input
        ref={inputRef}
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.shiftKey ? goPrev() : goNext();
          if (e.key === "Escape") handleClear();
        }}
        placeholder="Search"
        className="h-full flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />

      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {count === 0 ? "0 highlights" : `${displayIndex} / ${count}`}
      </span>

      <button
        onClick={goPrev}
        disabled={count === 0}
        aria-label="Previous match"
        className="rounded p-0.5 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
      >
        <ChevronUp className="size-3.5" />
      </button>
      <button
        onClick={goNext}
        disabled={count === 0}
        aria-label="Next match"
        className="rounded p-0.5 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
      >
        <ChevronDown className="size-3.5" />
      </button>

      {query && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="rounded p-0.5 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Renders text with all query matches highlighted.
 * Use this instead of dangerouslySetInnerHTML mutation.
 */
export function HighlightedText({
  text,
  query,
  current,
  className,
}: {
  text: string;
  query: string;
  current: number;
  className?: string;
}) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const matches = findMatches(text, query);
  if (matches.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let last = 0;

  matches.forEach((m, i) => {
    if (m.start > last) {
      parts.push(
        <span key={`t-${i}`}>{text.slice(last, m.start)}</span>,
      );
    }
    parts.push(
      <mark
        key={`m-${i}`}
        className={cn(
          "rounded-sm bg-yellow-300 text-black dark:bg-yellow-500 dark:text-black",
          i === current && "ring-2 ring-orange-500",
        )}
      >
        {text.slice(m.start, m.end)}
      </mark>,
    );
    last = m.end;
  });

  if (last < text.length) {
    parts.push(<span key="tail">{text.slice(last)}</span>);
  }

  return <span className={className}>{parts}</span>;
}
