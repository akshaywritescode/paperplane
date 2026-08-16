"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Server,
  Loader2,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  Copy,
  Check,
  ChevronsUpDown,
  WrapText,
} from "lucide-react";
import { SiCss, SiHtml5, SiJavascript, SiJson, SiXml } from "@icons-pack/react-simple-icons";
import { getSingletonHighlighter } from "shiki";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MockEndpoint, HttpMethod } from "@/lib/mocks";
import {
  fetchMockEndpointsAction,
  createMockEndpointAction,
  updateMockEndpointAction,
  deleteMockEndpointAction,
} from "./actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "ANY"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50",
  POST:   "text-amber-700   bg-amber-100   dark:text-amber-400   dark:bg-amber-950/50",
  PUT:    "text-blue-700    bg-blue-100    dark:text-blue-400    dark:bg-blue-950/50",
  PATCH:  "text-violet-700  bg-violet-100  dark:text-violet-400  dark:bg-violet-950/50",
  DELETE: "text-red-700     bg-red-100     dark:text-red-400     dark:bg-red-950/50",
  ANY:    "text-slate-600   bg-slate-100   dark:text-slate-400   dark:bg-slate-800/50",
};

const STATUS_COLORS: Record<string, string> = {
  "2": "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50",
  "3": "text-blue-700    bg-blue-100    dark:text-blue-400    dark:bg-blue-950/50",
  "4": "text-amber-700   bg-amber-100   dark:text-amber-400   dark:bg-amber-950/50",
  "5": "text-red-700     bg-red-100     dark:text-red-400     dark:bg-red-950/50",
};

type Lang = "json" | "html" | "xml" | "css" | "javascript" | "text";

const LANG_ICONS: Record<Lang, React.ReactNode> = {
  json:       <SiJson       className="size-3.5 shrink-0" />,
  html:       <SiHtml5      className="size-3.5 shrink-0" />,
  xml:        <SiXml        className="size-3.5 shrink-0" />,
  css:        <SiCss        className="size-3.5 shrink-0" />,
  javascript: <SiJavascript className="size-3.5 shrink-0" />,
  text: (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M3 5h10M3 8h7M3 11h5" />
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

const DEFAULT_BODY = `{\n  "message": "Hello from Paperplane Mock Server!"\n}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockUrl(userId: string, path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return `${base}/mock/${userId}/${path.replace(/^\/+/, "")}`;
}

function isValidJson(str: string): boolean {
  try { JSON.parse(str); return true; } catch { return false; }
}

function formatJson(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

function detectLang(code: string): Lang {
  const t = code.trimStart();
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) return "html";
  if (t.startsWith("<")) return "xml";
  return "text";
}

function statusClass(code: number): string {
  return STATUS_COLORS[String(code)[0]] ?? "text-slate-600 bg-slate-100";
}

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false,
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Highlighted editable body editor ────────────────────────────────────────

function MockBodyEditor({
  value,
  onChange,
  lang,
  onLangChange,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const dark = useDarkMode();
  const [html, setHtml] = useState("");
  const [wordWrap, setWordWrap] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  const theme        = dark ? "tokyo-night" : "one-light";
  const textColor    = dark ? "#a9b1d6" : "#383a42";
  const lineNumColor = dark ? "#3b4261" : "#c0c0c0";
  const hoverBg      = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const bgColor      = dark ? "#1a1b26" : "#fafafa";
  const caretColor   = dark ? "#c0caf5" : "#383a42";

  // The highlight layer always shows formatted JSON; the textarea stores raw input.
  const displayCode = lang === "json" ? formatJson(value) : value;

  useEffect(() => {
    if (!displayCode.trim()) { setHtml(""); return; }
    getSingletonHighlighter({
      themes: ["tokyo-night", "one-light"],
      langs:  ["json", "html", "xml", "css", "javascript"],
    }).then((hl) => {
      const raw = hl.codeToHtml(displayCode, {
        lang: lang === "text" ? "text" : lang,
        theme,
      });
      let lineNum = 0;
      const withLines = raw
        .split('<span class="line">')
        .map((part, i) => {
          if (i === 0) return part;
          lineNum++;
          const closeIdx = part.lastIndexOf("</span>");
          const content  = closeIdx !== -1 ? part.slice(0, closeIdx) : part;
          const rest     = closeIdx !== -1 ? part.slice(closeIdx)    : "";
          return `<span class="line"><span class="mbe-ln">${lineNum}</span><span class="mbe-code">${content}</span>${rest}`;
        })
        .join("");
      setHtml(withLines);
    });
  }, [displayCode, lang, theme]);

  // Tab key → insert 2 spaces
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = ta;
      const next = value.slice(0, s) + "  " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
    }
  }

  const wrapCss = wordWrap
    ? "white-space: pre-wrap; word-break: break-all; overflow-wrap: anywhere;"
    : "white-space: pre;";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-1.5 bg-muted/30">
        <span className="text-[11px] font-medium text-muted-foreground">Response body</span>
        <div className="flex items-center gap-1">
          {lang === "json" && (
            <button
              type="button"
              onClick={() => onChange(formatJson(value))}
              className="rounded px-2 py-1 text-[11px] font-medium text-orange-500 transition hover:bg-muted hover:text-orange-600"
            >
              Format
            </button>
          )}
          <button
            type="button"
            onClick={() => setWordWrap((v) => !v)}
            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
            className={cn(
              "flex size-6 items-center justify-center rounded transition",
              wordWrap
                ? "bg-orange-100 text-orange-600 dark:bg-orange-950/40"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <WrapText className="size-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted outline-none">
              {LANGS.find((l) => l.value === lang)?.label ?? "Auto"}
              {LANG_ICONS[lang]}
              <ChevronsUpDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="w-36">
              {LANGS.map((l) => (
                <DropdownMenuItem
                  key={l.value}
                  onClick={() => onLangChange(l.value)}
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
        </div>
      </div>

      {/*
        Single scroll container: the highlight div and textarea both live inside
        this one scrollable wrapper. The textarea grows to match its content via
        the CSS `field-sizing: content` trick (with a JS fallback via rows).
        Both layers are in normal flow — no absolute positioning that clips content.
      */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ background: bgColor, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.75rem", lineHeight: "1.35" }}
      >
        <style>{`
          .mbe-wrap { position: relative; min-height: 100%; }
          .mbe-hl   { position: absolute; inset: 0; pointer-events: none; background: transparent !important; }
          .mbe-hl pre { background: transparent !important; padding: 0.75rem 0; margin: 0; }
          .mbe-hl .line { display: flex; padding: 0 0.75rem; align-items: flex-start; min-height: 1.35em; }
          .mbe-hl .line:hover { background: ${hoverBg}; }
          .mbe-ln  { display: inline-block; min-width: 2.5rem; flex-shrink: 0; text-align: right; padding-right: 1rem; color: ${lineNumColor}; user-select: none; font-variant-numeric: tabular-nums; }
          .mbe-code { flex: 1; min-width: 0; ${wrapCss} }
          .mbe-ta  {
            display: block; width: 100%; min-height: 100%;
            padding: 0.75rem 0.75rem 0.75rem 3.25rem;
            background: transparent; border: none; outline: none; resize: none;
            font-family: inherit; font-size: inherit; line-height: inherit;
            color: transparent; caret-color: ${caretColor};
            field-sizing: content;
            ${wrapCss}
          }
        `}</style>

        {/*
          The wrapper div sets the height context. The highlight layer is absolute
          so it fills whatever height the textarea naturally occupies.
        */}
        <div className="mbe-wrap">
          {/* Highlight layer */}
          <div
            className="mbe-hl"
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: html || "" }}
            aria-hidden
          />

          {/* Textarea — grows with content, scroll is on the parent */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="mbe-ta"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button onClick={copy} title="Copy URL"
      className="flex items-center justify-center rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  path: string;
  method: HttpMethod;
  statusCode: number;
  responseBody: string;
  description: string;
  lang: Lang;
};

const EMPTY_FORM: FormState = {
  path: "",
  method: "GET",
  statusCode: 200,
  responseBody: formatJson(DEFAULT_BODY),
  description: "",
  lang: "json",
};

// ─── Right panel: editor ──────────────────────────────────────────────────────

function EndpointEditor({
  initial,
  userId,
  isNew,
  onSave,
  onDelete,
  onCancel,
}: {
  initial: FormState;
  userId: string;
  isNew: boolean;
  onSave: (data: FormState) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm]       = useState<FormState>(initial);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const pathRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const detectedLang = detectLang(initial.responseBody);
    const formattedBody =
      detectedLang === "json" ? formatJson(initial.responseBody) : initial.responseBody;
    setForm({ ...initial, lang: detectedLang, responseBody: formattedBody });
    setJsonError(null);
    if (isNew) setTimeout(() => pathRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.path, initial.method, isNew]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "responseBody") setJsonError(null);
  }

  // Validate on body blur
  function handleBodyChange(v: string) {
    set("responseBody", v);
    if (form.lang === "json" && v.trim()) {
      setJsonError(isValidJson(v) ? null : "Invalid JSON");
    } else {
      setJsonError(null);
    }
  }

  function handleLangChange(l: Lang) {
    set("lang", l);
    setJsonError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.path.trim()) return;
    if (form.lang === "json" && form.responseBody.trim() && !isValidJson(form.responseBody)) {
      setJsonError("Fix JSON errors before saving");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  const previewUrl = form.path.trim() ? mockUrl(userId, form.path) : null;

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">

      {/* ── Panel header ── */}
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold">
          {isNew ? "New endpoint" : "Edit endpoint"}
        </h2>
        <button type="button" onClick={onCancel}
          className="text-xs text-muted-foreground transition hover:text-foreground">
          Cancel
        </button>
      </div>

      {/* ── Top fields (method, path, status, description) ── */}
      <div className="shrink-0 space-y-4 border-b px-5 py-4">

        {/* Method + Path */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Endpoint</label>
          <div className="flex gap-2">
            {/* Method */}
            <div className="relative shrink-0">
              <select
                value={form.method}
                onChange={(e) => set("method", e.target.value as HttpMethod)}
                className={cn(
                  "h-9 w-24 appearance-none rounded-lg border pl-2.5 pr-6 text-xs font-bold outline-none transition focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 cursor-pointer",
                  METHOD_COLORS[form.method],
                )}
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 size-3 opacity-60" />
            </div>

            {/* Path */}
            <div className="flex flex-1 items-center overflow-hidden rounded-lg border bg-muted/40 transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20">
              <span className="shrink-0 select-none border-r bg-muted/60 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                /{userId.slice(0, 8)}…/
              </span>
              <input
                ref={pathRef}
                value={form.path}
                onChange={(e) => set("path", e.target.value)}
                placeholder="todos"
                className="min-w-0 flex-1 bg-transparent px-2.5 py-2 font-mono text-sm outline-none"
                spellCheck={false}
                required
              />
            </div>
          </div>

          {/* Live URL preview */}
          {previewUrl && (
            <div className="flex items-center gap-1.5 rounded-lg border border-dashed bg-muted/30 px-3 py-1.5">
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
                {previewUrl}
              </span>
              <CopyButton text={previewUrl} />
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                title="Open in browser"
                className="flex items-center justify-center rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Status + Description */}
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <input
              type="number" min={100} max={599}
              value={form.statusCode}
              onChange={(e) => set("statusCode", parseInt(e.target.value, 10) || 200)}
              className="w-full rounded-lg border bg-muted/40 px-2.5 py-2 text-center font-mono text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Description <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Returns a list of todos"
              className="w-full rounded-lg border bg-muted/40 px-3 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
        </div>
      </div>

      {/* ── Body editor (fills remaining space) ── */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden",
        jsonError && "border-b border-red-300 dark:border-red-800",
      )}>
        <MockBodyEditor
          value={form.responseBody}
          onChange={handleBodyChange}
          lang={form.lang}
          onLangChange={handleLangChange}
        />
        {jsonError && (
          <div className="flex shrink-0 items-center gap-1.5 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            {jsonError}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/20 px-5 py-3">
        {!isNew && onDelete ? (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            Delete
          </button>
        ) : <span />}

        <button
          type="submit"
          disabled={saving || !form.path.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          {isNew ? "Create endpoint" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ─── Left panel: endpoint row ─────────────────────────────────────────────────

function EndpointRow({ ep, isActive, onClick }: {
  ep: MockEndpoint;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border px-3 py-2.5 text-left transition-all",
        isActive
          ? "border-orange-300 bg-orange-50 dark:border-orange-800/60 dark:bg-orange-950/20"
          : "border-transparent hover:border-border hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold", METHOD_COLORS[ep.method])}>
          {ep.method}
        </span>
        <span className="flex-1 truncate font-mono text-xs font-medium text-foreground">
          /{ep.path}
        </span>
        <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", statusClass(ep.statusCode))}>
          {ep.statusCode}
        </span>
      </div>
      {ep.description && (
        <p className="mt-1 truncate pl-0.5 text-[11px] text-muted-foreground">{ep.description}</p>
      )}
    </button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Panel = { type: "none" } | { type: "new" } | { type: "edit"; id: string };

export function MockServerView({ userId }: { userId: string }) {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [loading, setLoading]     = useState(true);
  const [panel, setPanel]         = useState<Panel>({ type: "none" });

  useEffect(() => {
    fetchMockEndpointsAction().then((data) => {
      setEndpoints(data);
      setLoading(false);
    });
  }, []);

  const activeEndpoint = panel.type === "edit"
    ? endpoints.find((e) => e.id === panel.id) ?? null
    : null;

  async function handleCreate(form: FormState) {
    const created = await createMockEndpointAction({
      path:         form.path,
      method:       form.method,
      statusCode:   form.statusCode,
      responseBody: form.responseBody,
      description:  form.description,
    });
    if (created) {
      setEndpoints((prev) => [created, ...prev]);
      setPanel({ type: "edit", id: created.id });
      toast.success("Endpoint created");
    } else {
      toast.error("Failed to create endpoint");
    }
  }

  async function handleUpdate(id: string, form: FormState) {
    await updateMockEndpointAction(id, {
      path:         form.path,
      method:       form.method,
      statusCode:   form.statusCode,
      responseBody: form.responseBody,
      description:  form.description,
    });
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.id === id
          ? { ...ep, ...form, path: form.path.replace(/^\/+/, ""), updatedAt: Date.now() }
          : ep,
      ),
    );
    toast.success("Saved");
  }

  async function handleDelete(id: string) {
    await deleteMockEndpointAction(id);
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    setPanel({ type: "none" });
    toast.success("Endpoint deleted");
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const showPanel = panel.type !== "none";

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ══ Left: list ══ */}
      <div className={cn(
        "flex flex-col overflow-hidden border-r transition-all",
        showPanel ? "w-72 shrink-0" : "flex-1",
      )}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div>
            <h1 className="text-sm font-semibold">Mock Server</h1>
            <p className="text-[11px] text-muted-foreground">
              {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setPanel({ type: "new" })}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
          >
            <Plus className="size-3.5" />
            {!showPanel && <span>New endpoint</span>}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {endpoints.length === 0 && panel.type !== "new" ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Server className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium">No endpoints yet</p>
                <p className="mt-0.5 text-[11px]">Click "New endpoint" to get started</p>
              </div>
            </div>
          ) : (
            endpoints.map((ep) => (
              <EndpointRow
                key={ep.id}
                ep={ep}
                isActive={panel.type === "edit" && panel.id === ep.id}
                onClick={() => setPanel({ type: "edit", id: ep.id })}
              />
            ))
          )}
        </div>
      </div>

      {/* ══ Right: editor ══ */}
      {showPanel && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {panel.type === "new" && (
            <EndpointEditor
              key="new"
              initial={EMPTY_FORM}
              userId={userId}
              isNew
              onSave={handleCreate}
              onCancel={() => setPanel({ type: "none" })}
            />
          )}
          {panel.type === "edit" && activeEndpoint && (
            <EndpointEditor
              key={activeEndpoint.id}
              initial={{
                path:         activeEndpoint.path,
                method:       activeEndpoint.method,
                statusCode:   activeEndpoint.statusCode,
                responseBody: activeEndpoint.responseBody,
                description:  activeEndpoint.description,
                lang:         "json", // overridden by useEffect auto-detect
              }}
              userId={userId}
              isNew={false}
              onSave={(form) => handleUpdate(activeEndpoint.id, form)}
              onDelete={() => handleDelete(activeEndpoint.id)}
              onCancel={() => setPanel({ type: "none" })}
            />
          )}
        </div>
      )}
    </div>
  );
}
