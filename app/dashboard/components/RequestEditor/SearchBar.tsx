"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** ref to the scrollable content container to search within */
  contentRef: React.RefObject<HTMLElement | null>;
  className?: string;
};

export function SearchBar({ contentRef, className }: Props) {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Store original HTML so we can restore it when clearing
  const originalHtml = useRef<string | null>(null);

  const clearHighlights = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    if (originalHtml.current !== null) {
      el.innerHTML = originalHtml.current;
      originalHtml.current = null;
    }
    setMatchCount(0);
    setCurrentMatch(0);
  }, [contentRef]);

  const highlight = useCallback(
    (q: string) => {
      const el = contentRef.current;
      if (!el) return;

      // Restore original before re-highlighting
      if (originalHtml.current !== null) {
        el.innerHTML = originalHtml.current;
      } else {
        originalHtml.current = el.innerHTML;
      }

      if (!q.trim()) {
        setMatchCount(0);
        setCurrentMatch(0);
        return;
      }

      // Walk text nodes and wrap matches
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");

      let count = 0;

      function walkNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent ?? "";
          if (!regex.test(text)) return;
          regex.lastIndex = 0;

          const frag = document.createDocumentFragment();
          let last = 0;
          let m: RegExpExecArray | null;

          while ((m = regex.exec(text)) !== null) {
            if (m.index > last) {
              frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            }
            const mark = document.createElement("mark");
            mark.dataset.match = String(count++);
            mark.className =
              "rounded-sm bg-yellow-300 text-black dark:bg-yellow-500 dark:text-black";
            mark.textContent = m[0];
            frag.appendChild(mark);
            last = regex.lastIndex;
          }

          if (last < text.length) {
            frag.appendChild(document.createTextNode(text.slice(last)));
          }

          node.parentNode?.replaceChild(frag, node);
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).tagName !== "MARK"
        ) {
          Array.from(node.childNodes).forEach(walkNode);
        }
      }

      walkNode(el);
      setMatchCount(count);
      setCurrentMatch(count > 0 ? 1 : 0);

      // Scroll first match into view
      const first = el.querySelector("mark[data-match='0']");
      first?.scrollIntoView({ block: "nearest" });
    },
    [contentRef],
  );

  function scrollToMatch(idx: number) {
    const el = contentRef.current;
    if (!el || matchCount === 0) return;
    const marks = el.querySelectorAll<HTMLElement>("mark[data-match]");
    marks.forEach((m) => m.classList.remove("ring-2", "ring-orange-500"));
    const target = marks[idx];
    if (target) {
      target.classList.add("ring-2", "ring-orange-500");
      target.scrollIntoView({ block: "nearest" });
    }
  }

  function goNext() {
    if (matchCount === 0) return;
    const next = currentMatch % matchCount;
    setCurrentMatch(next + 1);
    scrollToMatch(next);
  }

  function goPrev() {
    if (matchCount === 0) return;
    const prev = (currentMatch - 2 + matchCount) % matchCount;
    setCurrentMatch(prev + 1);
    scrollToMatch(prev);
  }

  function handleClear() {
    setQuery("");
    clearHighlights();
    inputRef.current?.focus();
  }

  useEffect(() => {
    highlight(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Cleanup on unmount
  useEffect(() => () => clearHighlights(), [clearHighlights]);

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
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.shiftKey ? goPrev() : goNext();
          }
          if (e.key === "Escape") handleClear();
        }}
        placeholder="Search"
        className="h-full flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />

      {/* Match count */}
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {matchCount === 0 ? "0 highlights" : `${currentMatch} / ${matchCount}`}
      </span>

      {/* Prev / Next */}
      <button
        onClick={goPrev}
        disabled={matchCount === 0}
        aria-label="Previous match"
        className="rounded p-0.5 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
      >
        <ChevronUp className="size-3.5" />
      </button>
      <button
        onClick={goNext}
        disabled={matchCount === 0}
        aria-label="Next match"
        className="rounded p-0.5 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
      >
        <ChevronDown className="size-3.5" />
      </button>

      {/* Clear */}
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
