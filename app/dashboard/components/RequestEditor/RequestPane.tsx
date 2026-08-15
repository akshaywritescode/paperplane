"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { HttpMethod, ParamRow, HeaderRow, AuthConfig, BodyConfig, FormField, MultipartField, RawContentType } from "./index";
import { buildAuthHeader, buildAuthQueryParam } from "./auth";
import { DEFAULT_BODY, hasBodyContent } from "./body";

type Props = {
  method: HttpMethod;
  url: string;
  params: ParamRow[];
  headers: HeaderRow[];
  body: BodyConfig;
  auth: AuthConfig;
  onParamsChange: (rows: ParamRow[]) => void;
  onHeadersChange: (rows: HeaderRow[]) => void;
  onBodyChange: (body: BodyConfig) => void;
  onAuthChange: (auth: AuthConfig) => void;
  onSendToRepeater: () => void;
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
  body: BodyConfig,
  auth: AuthConfig,
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

  // Also show API Key query param in the URL line so Raw reflects what gets sent
  const authQp = buildAuthQueryParam(auth);
  if (authQp) {
    path += (path.includes("?") ? "&" : "?") + `${encodeURIComponent(authQp.key)}=${encodeURIComponent(authQp.value)}`;
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

  // Auth header (shown before custom headers, matching real request order)
  const authHeader = buildAuthHeader(auth);
  Object.entries(authHeader).forEach(([k, v]) => {
    lines.push(
      <div key={`auth-${lineNum}`} className="flex gap-2">
        <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
        <span>
          <span className={RAW_COLORS.key}>{k}</span>
          <span className={RAW_COLORS.colon}>: </span>
          <span className={RAW_COLORS.value}>{v}</span>
        </span>
      </div>,
    );
  });

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

  if (hasBodyContent(body) && body.type === "raw" && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const len = new Blob([body.content]).size;
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

  lines.push(
    <div key={`blank-${lineNum}`} className="flex gap-2">
      <span className={`w-8 shrink-0 select-none text-right ${RAW_COLORS.lineNum}`}>{lineNum++}</span>
      <span>&nbsp;</span>
    </div>,
  );

  const bodyStr =
    body.type === "raw" ? body.content
    : body.type === "form" ? "<form fields — see Body tab>"
    : "<multipart — see Body tab>";

  if (hasBodyContent(body) && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    bodyStr.split("\n").forEach((line, i) => {
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

// ─── BODY PANEL ─────────────────────────────────────────────────────────────

const BODY_MODES = [
  { id: "raw",        label: "Raw"       },
  { id: "form",       label: "Form"      },
  { id: "multipart",  label: "Multipart" },
] as const;

const RAW_CONTENT_TYPES: { value: RawContentType; label: string }[] = [
  { value: "application/json",       label: "JSON"       },
  { value: "text/plain",             label: "Text"       },
  { value: "application/xml",        label: "XML"        },
  { value: "text/html",              label: "HTML"       },
  { value: "application/javascript", label: "JavaScript" },
];

function newFormField(): FormField {
  return { id: crypto.randomUUID(), enabled: true, name: "", value: "" };
}

function newMultipartField(): MultipartField {
  return { id: crypto.randomUUID(), enabled: true, name: "", isFile: false, value: "" };
}

function BodyPanel({
  body,
  onBodyChange,
}: {
  body: BodyConfig;
  onBodyChange: (b: BodyConfig) => void;
}) {
  function switchMode(mode: BodyConfig["type"]) {
    if (mode === "raw")       onBodyChange(DEFAULT_BODY);
    if (mode === "form")      onBodyChange({ type: "form",      fields: [newFormField()] });
    if (mode === "multipart") onBodyChange({ type: "multipart", fields: [newMultipartField()] });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Mode selector */}
      <div className="flex shrink-0 gap-1 border-b p-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {BODY_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                body.type === m.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {/* Content-type picker for Raw mode */}
        {body.type === "raw" && (
          <select
            value={body.contentType}
            onChange={(e) =>
              onBodyChange({ ...body, contentType: e.target.value as RawContentType })
            }
            className="ml-auto rounded-md border bg-transparent px-2 py-1 text-xs text-muted-foreground outline-none transition focus:border-orange-400 focus:text-foreground"
          >
            {RAW_CONTENT_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Raw */}
      {body.type === "raw" && (
        <textarea
          value={body.content}
          onChange={(e) => onBodyChange({ ...body, content: e.target.value })}
          placeholder={
            body.contentType === "application/json"
              ? '{\n  "key": "value"\n}'
              : body.contentType === "application/xml"
              ? "<root>\n  <key>value</key>\n</root>"
              : "Enter body content..."
          }
          spellCheck={false}
          className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
        />
      )}

      {/* Form (x-www-form-urlencoded) */}
      {body.type === "form" && (
        <div className="flex flex-1 flex-col overflow-auto">
          {body.fields.map((row) => (
            <div key={row.id} className="group flex items-center border-b last:border-0 text-xs">
              <button
                onClick={() =>
                  onBodyChange({
                    ...body,
                    fields: body.fields.map((f) =>
                      f.id === row.id ? { ...f, enabled: !f.enabled } : f,
                    ),
                  })
                }
                className="px-2 text-muted-foreground hover:text-foreground"
              >
                <span className={cn("text-[10px]", row.enabled ? "text-orange-500" : "text-muted-foreground/40")}>●</span>
              </button>
              <input
                value={row.name}
                onChange={(e) =>
                  onBodyChange({
                    ...body,
                    fields: body.fields.map((f) =>
                      f.id === row.id ? { ...f, name: e.target.value } : f,
                    ),
                  })
                }
                placeholder="field name"
                className="flex-1 bg-transparent px-3 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
              />
              <span className="shrink-0 text-muted-foreground/40">=</span>
              <input
                value={row.value}
                onChange={(e) =>
                  onBodyChange({
                    ...body,
                    fields: body.fields.map((f) =>
                      f.id === row.id ? { ...f, value: e.target.value } : f,
                    ),
                  })
                }
                placeholder="value"
                className="flex-1 bg-transparent px-3 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
              />
              <button
                onClick={() =>
                  onBodyChange({ ...body, fields: body.fields.filter((f) => f.id !== row.id) })
                }
                className="px-2 text-transparent group-hover:text-muted-foreground hover:!text-destructive transition"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => onBodyChange({ ...body, fields: [...body.fields, newFormField()] })}
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <Plus className="size-3" /> Add field
          </button>
        </div>
      )}

      {/* Multipart */}
      {body.type === "multipart" && (
        <div className="flex flex-1 flex-col overflow-auto">
          {body.fields.map((row) => (
            <div key={row.id} className="group flex items-center border-b last:border-0 text-xs gap-1 px-1">
              <button
                onClick={() =>
                  onBodyChange({
                    ...body,
                    fields: body.fields.map((f) =>
                      f.id === row.id ? { ...f, enabled: !f.enabled } : f,
                    ) as MultipartField[],
                  })
                }
                className="px-1 shrink-0"
              >
                <span className={cn("text-[10px]", row.enabled ? "text-orange-500" : "text-muted-foreground/40")}>●</span>
              </button>
              <input
                value={row.name}
                onChange={(e) =>
                  onBodyChange({
                    ...body,
                    fields: body.fields.map((f) =>
                      f.id === row.id ? { ...f, name: e.target.value } : f,
                    ) as MultipartField[],
                  })
                }
                placeholder="name"
                className="w-28 shrink-0 bg-transparent px-2 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition"
              />
              {/* Text / File toggle */}
              <div className="flex shrink-0 gap-0.5 rounded-md border p-0.5">
                {(["text", "file"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t === "text" && row.isFile) {
                        onBodyChange({
                          ...body,
                          fields: body.fields.map((f) =>
                            f.id === row.id
                              ? { id: f.id, enabled: f.enabled, name: f.name, isFile: false, value: "" }
                              : f,
                          ) as MultipartField[],
                        });
                      } else if (t === "file" && !row.isFile) {
                        onBodyChange({
                          ...body,
                          fields: body.fields.map((f) =>
                            f.id === row.id
                              ? { id: f.id, enabled: f.enabled, name: f.name, isFile: true, fileName: "", fileType: "", fileData: "" }
                              : f,
                          ) as MultipartField[],
                        });
                      }
                    }}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors capitalize",
                      (t === "text") === !row.isFile
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* Value or file picker */}
              {!row.isFile ? (
                <input
                  value={row.value}
                  onChange={(e) =>
                    onBodyChange({
                      ...body,
                      fields: body.fields.map((f) =>
                        f.id === row.id ? { ...f, value: e.target.value } : f,
                      ) as MultipartField[],
                    })
                  }
                  placeholder="value"
                  className="flex-1 bg-transparent px-2 py-2 font-mono outline-none focus:bg-orange-50 dark:focus:bg-orange-950/20 transition min-w-0"
                />
              ) : (
                <label className="flex flex-1 min-w-0 cursor-pointer items-center gap-2 px-2 py-1.5">
                  <span className="truncate text-muted-foreground">
                    {row.fileName || "Choose file…"}
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const b64 = (reader.result as string).split(",")[1] ?? "";
                        onBodyChange({
                          ...body,
                          fields: body.fields.map((f) =>
                            f.id === row.id
                              ? { ...f, fileName: file.name, fileType: file.type || "application/octet-stream", fileData: b64 }
                              : f,
                          ) as MultipartField[],
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
              <button
                onClick={() =>
                  onBodyChange({ ...body, fields: body.fields.filter((f) => f.id !== row.id) as MultipartField[] })
                }
                className="shrink-0 px-2 text-transparent group-hover:text-muted-foreground hover:!text-destructive transition"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onBodyChange({ ...body, fields: [...body.fields, newMultipartField()] as MultipartField[] })
            }
            className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <Plus className="size-3" /> Add field
          </button>
        </div>
      )}
    </div>
  );
}

// ─── AUTH PANEL ─────────────────────────────────────────────────────────────

const AUTH_MODES = [

  { id: "none",   label: "None"    },
  { id: "bearer", label: "Bearer"  },
  { id: "basic",  label: "Basic"   },
  { id: "apikey", label: "API Key" },
] as const;

const INPUT_CLS =
  "w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs outline-none transition " +
  "focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 placeholder:text-muted-foreground";

function AuthPanel({
  auth,
  onAuthChange,
}: {
  auth: AuthConfig;
  onAuthChange: (a: AuthConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-5 overflow-auto p-4">
      {/* Mode selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {AUTH_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              if (m.id === "none")   onAuthChange({ type: "none" });
              if (m.id === "bearer") onAuthChange({ type: "bearer", token:    auth.type === "bearer" ? auth.token    : "" });
              if (m.id === "basic")  onAuthChange({ type: "basic",  username: auth.type === "basic"  ? auth.username : "", password: auth.type === "basic" ? auth.password : "" });
              if (m.id === "apikey") onAuthChange({ type: "apikey", key:     auth.type === "apikey" ? auth.key     : "X-API-Key", value: auth.type === "apikey" ? auth.value : "", in: auth.type === "apikey" ? auth.in : "header" });
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              auth.type === m.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* None */}
      {auth.type === "none" && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No authentication will be sent with this request.
        </p>
      )}

      {/* Bearer Token */}
      {auth.type === "bearer" && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Token</label>
          <input
            type="text"
            value={auth.token}
            onChange={(e) => onAuthChange({ ...auth, token: e.target.value })}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className={INPUT_CLS}
          />
          <p className="text-[10px] text-muted-foreground">
            Sends:{" "}
            <code className="font-mono">Authorization: Bearer &lt;token&gt;</code>
          </p>
        </div>
      )}

      {/* Basic Auth */}
      {auth.type === "basic" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <input
              type="text"
              value={auth.username}
              onChange={(e) => onAuthChange({ ...auth, username: e.target.value })}
              placeholder="username"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              value={auth.password}
              onChange={(e) => onAuthChange({ ...auth, password: e.target.value })}
              placeholder="••••••••"
              className={INPUT_CLS}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Sends:{" "}
            <code className="font-mono">Authorization: Basic &lt;base64(user:pass)&gt;</code>
          </p>
        </div>
      )}

      {/* API Key */}
      {auth.type === "apikey" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Key name</label>
            <input
              type="text"
              value={auth.key}
              onChange={(e) => onAuthChange({ ...auth, key: e.target.value })}
              placeholder="X-API-Key"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Value</label>
            <input
              type="text"
              value={auth.value}
              onChange={(e) => onAuthChange({ ...auth, value: e.target.value })}
              placeholder="your-api-key-here"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Send via</label>
            <div className="flex gap-2">
              {(["header", "query"] as const).map((loc) => (
                <button
                  key={loc}
                  onClick={() => onAuthChange({ ...auth, in: loc })}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    auth.in === loc
                      ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {loc === "header" ? "Header" : "Query Param"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {auth.in === "header" ? (
                <>Sends: <code className="font-mono">{auth.key || "X-API-Key"}: &lt;value&gt;</code></>
              ) : (
                <>Appends: <code className="font-mono">?{auth.key || "key"}=&lt;value&gt;</code></>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RequestPane({
  method,
  url,
  params,
  headers,
  body,
  auth,
  onParamsChange,
  onHeadersChange,
  onBodyChange,
  onAuthChange,
  onSendToRepeater,
}: Props) {
  const [tab, setTab] = useState<Tab>("raw");

  const isMac = typeof navigator !== "undefined"
    && /mac/i.test(navigator.userAgent)
    && !/windows/i.test(navigator.userAgent);
  const shortcutLabel = isMac ? "⌥R" : "Ctrl+R";

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mac = /mac/i.test(navigator.userAgent) && !/windows/i.test(navigator.userAgent);
      const triggered = mac
        ? e.altKey && e.key.toLowerCase() === "r"
        : e.ctrlKey && e.key.toLowerCase() === "r";
      if (triggered) {
        e.preventDefault();
        onSendToRepeater();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSendToRepeater]);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex w-1/2 flex-col overflow-hidden">
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
              {t.id === "auth" && auth.type !== "none" && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-orange-500 align-middle" />
              )}
              {t.id === "body" && hasBodyContent(body) && (
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-orange-500 align-middle" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {tab === "raw" && (
            <div className="h-full overflow-auto bg-background">
              <pre className="p-4 font-mono text-xs leading-[1.6]">
                {url ? (
                  buildRawPreview(method, url, params, headers, body, auth)
                ) : (
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
            <AuthPanel auth={auth} onAuthChange={onAuthChange} />
          )}
          {tab === "body" && (
            <BodyPanel body={body} onBodyChange={onBodyChange} />
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onSendToRepeater}>
          <RotateCw className="size-3" />
          Send to Repeater
          <ContextMenuShortcut>{shortcutLabel}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>
          More actions coming soon
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
