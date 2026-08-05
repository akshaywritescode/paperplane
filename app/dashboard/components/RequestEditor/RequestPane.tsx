"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HttpMethod, ParamRow, HeaderRow } from "./index";

type Props = {
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: string;
  onParamsChange: (rows: ParamRow[]) => void;
  onHeadersChange: (rows: HeaderRow[]) => void;
  onBodyChange: (body: string) => void;
};

type Tab = "raw" | "params" | "headers" | "auth" | "body";

const TABS: { id: Tab; label: string }[] = [
  { id: "raw",     label: "Raw"     },
  { id: "params",  label: "Params"  },
  { id: "headers", label: "Headers" },
  { id: "auth",    label: "Auth"    },
  { id: "body",    label: "Body"    },
];

const RAW_COLORS = {
  method:  "text-emerald-600 dark:text-emerald-400",
  path:    "text-sky-600    dark:text-sky-300",
  version: "text-slate-400  dark:text-slate-500",
  key:     "text-orange-600 dark:text-orange-300",
  value:   "text-slate-700  dark:text-slate-200",
  colon:   "text-slate-400  dark:text-slate-600",
  body:    "text-slate-600  dark:text-slate-300",
  lineNum: "text-slate-300  dark:text-slate-600",
  hint:    "text-slate-400  dark:text-slate-600",
};

function buildRawPreview(
  method: HttpMethod,
  url: string,
  params: ParamRow[],
  headers: HeaderRow[],
  body: string,
): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  let lineNum = 1;

  let path = "/";
  let host = "";
  try {
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(fullUrl);
    host = parsed.host;
    path = parsed.pathname + parsed.search;
  } catch {
    path = url || "/";
  }

  const enabledParams = params.filter((p) => p.enabled && p.name);
  if (enabledParams.length) {
    const qs = enabledParams
      .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
      .join("&");
    path += (path.includes("?") ? "&" : "?") + qs;
  }

  lines.push(
    <div key={lineNum} className="flex gap-2">
      <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
      <span>
        <span className={RAW_COLORS.method}>{method}</span>
        <span> </span>
        <span className={RAW_COLORS.path}>{path || "/"}</span>
        <span className={RAW_COLORS.version}> HTTP/1.1</span>
      </span>
    </div>,
  );

  if (host) {
    lines.push(
      <div key={lineNum} className="flex gap-2">
        <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
        <span>
          <span className={RAW_COLORS.key}>Host</span>
          <span className={RAW_COLORS.colon}>: </span>
          <span className={RAW_COLORS.value}>{host}</span>
        </span>
      </div>,
    );
  }

  headers.filter((h) => h.enabled && h.name).forEach((h) => {
    lines.push(
      <div key={lineNum} className="flex gap-2">
        <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
        <span>
          <span className={RAW_COLORS.key}>{h.name}</span>
          <span className={RAW_COLORS.colon}>: </span>
          <span className={RAW_COLORS.value}>{h.value}</span>
        </span>
      </div>,
    );
  });

  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    const len = new Blob([body]).size;
    lines.push(
      <div key={lineNum} className="flex gap-2">
        <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
        <span>
          <span className={RAW_COLORS.key}>Content-Length</span>
          <span className={RAW_COLORS.colon}>: </span>
          <span className={RAW_COLORS.value}>{len}</span>
        </span>
      </div>,
    );
  }

  // Blank separator line
  lines.push(
    <div key={`blank-${lineNum}`} className="flex gap-2">
      <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
      <span>&nbsp;</span>
    </div>,
  );

  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    body.split("\n").forEach((line, i) => {
      lines.push(
        <div key={`body-${i}`} className="flex gap-2">
          <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
          <span className={RAW_COLORS.body}>{line}</span>
        </div>,
      );
    });
  }

  return lines;
}

function newRow(): ParamRow {
  return { id: crypto.randomUUID(), enabled: true, name: "", value: "" };
}

function KeyValueTable({
  rows,
  onChange,
  placeholder = { name: "name", value: "value" },
}: {
  rows: ParamRow[] | HeaderRow[];
  onChange: (rows: any[]) => void;
  placeholder?: { name: string; value: string };
}) {
  function update(id: string, patch: Partial<ParamRow>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }
  function add() {
    onChange([...rows, newRow()]);
  }

  return (
    <div className="flex flex-col text-sm">
      <div className="grid grid-cols-[2rem_1fr_1fr_2rem] border-b text-xs font-medium text-muted-foreground">
        <div className="px-2 py-2" />
        <div className="px-3 py-2">{placeholder.name}</div>
        <div className="px-3 py-2">{placeholder.value}</div>
        <div />
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[2rem_1fr_1fr_2rem] border-b last:border-b-0 hover:bg-muted/30"
        >
          <div className="flex items-center justify-center px-2">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, { enabled: e.target.checked })}
              className="accent-orange-500"
            />
          </div>
          <input
            value={row.name}
            onChange={(e) => update(row.id, { name: e.target.value })}
            placeholder="name"
            className="border-r bg-transparent px-3 py-2 font-mono text-xs outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
          />
          <input
            value={row.value}
            onChange={(e) => update(row.id, { value: e.target.value })}
            placeholder="value"
            className="bg-transparent px-3 py-2 font-mono text-xs outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
          />
          <button
            onClick={() => remove(row.id)}
            className="flex items-center justify-center text-muted-foreground hover:text-destructive transition"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}

      <button
        onClick={add}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <Plus className="size-3.5" />
        Add row
      </button>
    </div>
  );
}

export function RequestPane({
  method,
  url,
  params,
  headers,
  body,
  onParamsChange,
  onHeadersChange,
  onBodyChange,
}: Props) {
  const [tab, setTab] = useState<Tab>("raw");

  return (
    <div className="flex w-1/2 flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex h-10 shrink-0 items-center border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-full px-4 text-xs font-medium transition-colors border-b-2",
              tab === t.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.id === "params" && params.filter((p) => p.name).length > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-600">
                {params.filter((p) => p.name).length}
              </span>
            )}
            {t.id === "headers" && headers.filter((h) => h.name).length > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] text-orange-600">
                {headers.filter((h) => h.name).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === "raw" && (
          <div className="h-full overflow-auto bg-background">
            <pre className="p-4 font-mono text-xs leading-[1.6]">
              {url
                ? buildRawPreview(method, url, params, headers, body)
                : (
                  <div className="flex gap-2">
                    <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>1</span>
                    <span className={`italic ${RAW_COLORS.hint}`}>Enter a URL to preview the request...</span>
                  </div>
                )}
            </pre>
          </div>
        )}
        {tab === "params" && (
          <KeyValueTable
            rows={params}
            onChange={onParamsChange}
            placeholder={{ name: "parameter", value: "value" }}
          />
        )}
        {tab === "headers" && (
          <KeyValueTable
            rows={headers}
            onChange={onHeadersChange}
            placeholder={{ name: "header", value: "value" }}
          />
        )}
        {tab === "auth" && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <p className="text-sm">Auth configuration coming soon</p>
          </div>
        )}
        {tab === "body" && (
          <textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder='{"key": "value"}'
            spellCheck={false}
            className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}
