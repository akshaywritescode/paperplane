"use client";

import { useEffect, useState } from "react";
import { getSingletonHighlighter } from "shiki";

type Props = {
  code: string;
  lang?: "json" | "html" | "xml" | "text" | "css" | "javascript";
  searchQuery?: string;
  searchCurrent?: number;
  wordWrap?: boolean;
};

export function detectLang(code: string, contentType?: string): "json" | "html" | "xml" | "text" | "css" | "javascript" {
  // First try content-type header
  if (contentType) {
    if (contentType.includes("json")) return "json";
    if (contentType.includes("html")) return "html";
    if (contentType.includes("xml")) return "xml";
    if (contentType.includes("css")) return "css";
    if (contentType.includes("javascript") || contentType.includes("ecmascript")) return "javascript";
    if (contentType.includes("text/plain")) return "text";
  }
  // Fall back to body sniffing
  const trimmed = code.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) return "html";
  if (trimmed.startsWith("<")) return "xml";
  return "text";
}

function formatJson(code: string): string {
  try {
    return JSON.stringify(JSON.parse(code), null, 2);
  } catch {
    return code;
  }
}

function injectLineNumbers(html: string): string {
  let lineNum = 0;
  // Split on opening line spans, wrap content in line-code span
  return html.split('<span class="line">').map((part, i) => {
    if (i === 0) return part; // content before first line
    lineNum++;
    // Find the closing </span> for this line and wrap content
    const closeIdx = part.lastIndexOf("</span>");
    const content = closeIdx !== -1 ? part.slice(0, closeIdx) : part;
    const rest = closeIdx !== -1 ? part.slice(closeIdx) : "";
    return `<span class="line"><span class="line-number">${lineNum}</span><span class="line-code">${content}</span>${rest}`;
  }).join("");
}

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export function CodeBlock({ code, lang, searchQuery = "", searchCurrent = 0, wordWrap = false }: Props) {
  const dark = useDarkMode();
  const [html, setHtml] = useState<string>("");
  const resolvedLang = lang ?? detectLang(code);
  const displayCode = resolvedLang === "json" ? formatJson(code) : code;
  const theme = dark ? "tokyo-night" : "one-light";

  const textColor    = dark ? "#a9b1d6" : "#383a42";
  const lineNumColor = dark ? "#3b4261" : "#c0c0c0";
  const hoverBg      = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  useEffect(() => {
    if (!displayCode) { setHtml(""); return; }

    getSingletonHighlighter({
      themes: ["tokyo-night", "one-light"],
      langs: ["json", "html", "xml", "css", "javascript"],
    }).then((highlighter) => {
      const raw = highlighter.codeToHtml(displayCode, {
        lang: resolvedLang === "text" ? "text" : resolvedLang,
        theme,
      });
      setHtml(injectLineNumbers(raw));
    });
  }, [displayCode, resolvedLang, theme]);

  // Apply search highlights on top of shiki HTML
  function applySearch(rawHtml: string): string {
    if (!searchQuery.trim()) return rawHtml;
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    let matchIdx = 0;
    return rawHtml.replace(/>([^<]+)</g, (full, text: string) => {
      if (!regex.test(text)) { regex.lastIndex = 0; return full; }
      regex.lastIndex = 0;
      const replaced = text.replace(regex, (m) => {
        const isCurrent = matchIdx === searchCurrent;
        matchIdx++;
        return `<mark style="background:${isCurrent ? "#f97316" : "#fde047"};color:#000;border-radius:2px${isCurrent ? ";outline:2px solid #f97316;outline-offset:1px" : ""}">${m}</mark>`;
      });
      return `>${replaced}<`;
    });
  }

  if (!html) {
    const lines = displayCode.split("\n");
    return (
      <div className="flex-1 overflow-auto bg-background p-4">
        <pre className={`font-mono text-xs leading-relaxed ${wordWrap ? "whitespace-pre-wrap break-all" : ""}`} style={{ color: textColor }}>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span
                className="w-10 shrink-0 select-none pr-4 text-right"
                style={{ color: lineNumColor }}
              >
                {i + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .shiki-block { flex: 1; overflow: auto; background: transparent !important; }
        .shiki-block pre {
          background: transparent !important;
          padding: 1rem 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.75rem;
          line-height: 1.35;
        }
        .shiki-block .line {
          display: flex;
          padding: 0 1rem;
          align-items: flex-start;
        }
        .shiki-block .line:hover { background: ${hoverBg}; }
        .shiki-block .line-number {
          display: inline-block;
          min-width: 3rem;
          flex-shrink: 0;
          align-self: flex-start;
          text-align: right;
          padding-right: 1.25rem;
          color: ${lineNumColor};
          user-select: none;
          font-variant-numeric: tabular-nums;
        }
        .shiki-block .line-code {
          flex: 1;
          min-width: 0;
          ${wordWrap ? "white-space: pre-wrap; word-break: break-all; overflow-wrap: anywhere;" : "white-space: pre;"}
        }
      `}</style>
      <div
        className="shiki-block flex-1 overflow-auto bg-background"
        dangerouslySetInnerHTML={{ __html: applySearch(html) }}
      />
    </>
  );
}
