"use client";

import { useState, useRef } from "react";
import { Plus, X, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRepeater } from "../context/RepeaterContext";
import type { RepeaterTab } from "../context/RepeaterContext";
import { UrlBar } from "../components/RequestEditor/UrlBar";
import { RequestPane } from "../components/RequestEditor/RequestPane";
import { ResponsePane } from "../components/RequestEditor/ResponsePane";
import type {
  HttpMethod,
  ParamRow,
  HeaderRow,
  ResponseState,
  RequestTab,
} from "../components/RequestEditor";

const METHOD_COLORS: Record<string, string> = {
  GET:     "text-emerald-600",
  POST:    "text-amber-500",
  PUT:     "text-blue-500",
  PATCH:   "text-violet-500",
  DELETE:  "text-red-500",
  HEAD:    "text-slate-500",
  OPTIONS: "text-slate-500",
};

// Per-tab response + local param/header/body state lives here
type TabState = {
  params: ParamRow[];
  headers: HeaderRow[];
  body: string;
  response: ResponseState;
};

export function RepeaterEditor() {
  const { tabs, addTab, removeTab, updateTab } = useRepeater();
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? "");
  const [tabStates, setTabStates] = useState<Record<string, TabState>>({});
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  function startRename(e: React.MouseEvent, tab: RepeaterTab) {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditDraft(tab.name || "untitled");
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  function commitRename() {
    if (editingTabId) {
      updateTab(editingTabId, { name: editDraft.trim() || "untitled" });
    }
    setEditingTabId(null);
  }

  function cancelRename() {
    setEditingTabId(null);
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);

  function getTabState(id: string): TabState {
    return tabStates[id] ?? {
      params: tabs.find((t) => t.id === id)?.params ?? [],
      headers: tabs.find((t) => t.id === id)?.headers ?? [],
      body: tabs.find((t) => t.id === id)?.body ?? "",
      response: { status: "idle" },
    };
  }

  function setTabState(id: string, patch: Partial<TabState>) {
    setTabStates((prev) => ({
      ...prev,
      [id]: { ...getTabState(id), ...patch },
    }));
  }

  function handleAddEmpty() {
    addTab({
      name: "untitled",
      method: "GET",
      url: "",
      params: [],
      headers: [],
      body: "",
    });
  }

  function handleClose(id: string) {
    const idx = tabs.findIndex((t) => t.id === id);
    removeTab(id);
    if (id === activeTabId) {
      const next = tabs[idx === 0 ? 1 : idx - 1];
      setActiveTabId(next?.id ?? "");
    }
  }

  async function sendRequest() {
    if (!activeTab) return;
    const state = getTabState(activeTab.id);
    const url = activeTab.url.trim();
    if (!url) return;

    setTabState(activeTab.id, { response: { status: "loading" } });

    let finalUrl = url;
    const enabledParams = state.params.filter((p) => p.enabled && p.name);
    if (enabledParams.length) {
      const qs = enabledParams
        .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
        .join("&");
      finalUrl += (url.includes("?") ? "&" : "?") + qs;
    }

    const reqHeaders: Record<string, string> = {};
    state.headers.filter((h) => h.enabled && h.name).forEach((h) => {
      reqHeaders[h.name] = h.value;
    });

    const start = Date.now();

    try {
      const res = await fetch(finalUrl, {
        method: activeTab.method,
        headers: reqHeaders,
        body: ["POST", "PUT", "PATCH"].includes(activeTab.method)
          ? state.body || undefined
          : undefined,
      });

      const time = Date.now() - start;
      const text = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      setTabState(activeTab.id, {
        response: {
          status: "done",
          statusCode: res.status,
          statusText: res.statusText,
          time,
          size: new Blob([text]).size,
          headers: resHeaders,
          body: text,
        },
      });
    } catch (err) {
      setTabState(activeTab.id, {
        response: {
          status: "error",
          message: err instanceof Error ? err.message : "Request failed",
        },
      });
    }
  }

  if (tabs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <RotateCw className="size-7" />
        </div>
        <p className="text-sm font-medium">No repeater tabs yet</p>
        <p className="text-xs">Hit &ldquo;Send to Repeater&rdquo; from any response, or start a new tab.</p>
        <button
          onClick={handleAddEmpty}
          className="mt-2 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
        >
          <Plus className="size-4" />
          New repeater tab
        </button>
      </div>
    );
  }

  const state = activeTab ? getTabState(activeTab.id) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex h-10 shrink-0 items-center border-b bg-muted/40 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "group flex h-full shrink-0 items-center gap-1.5 border-r px-3 text-xs transition-colors",
              tab.id === activeTabId
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:bg-background/60",
            )}
          >
            <span className={cn("font-bold text-[10px] uppercase", METHOD_COLORS[tab.method])}>
              {tab.method}
            </span>
            {editingTabId === tab.id ? (
              <input
                ref={renameInputRef}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                  if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-24 min-w-0 rounded border border-orange-400 bg-background px-1 py-0 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-orange-400/40"
                autoFocus
              />
            ) : (
              <span
                className="max-w-32 truncate font-medium"
                onDoubleClick={(e) => startRename(e, tab)}
                title="Double-click to rename"
              >
                {tab.name || "untitled"}
              </span>
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); handleClose(tab.id); }}
              onKeyDown={(e) => e.key === "Enter" && handleClose(tab.id)}
              className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              aria-label="Close tab"
            >
              <X className="size-3" />
            </span>
          </button>
        ))}

        <button
          onClick={handleAddEmpty}
          aria-label="New repeater tab"
          className="flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {activeTab && state ? (
        <>
          {/* URL bar */}
          <UrlBar
            method={activeTab.method}
            url={activeTab.url}
            loading={state.response.status === "loading"}
            onMethodChange={(method) => updateTab(activeTab.id, { method })}
            onUrlChange={(url) => updateTab(activeTab.id, { url })}
            onSend={sendRequest}
          />

          {/* Split panes */}
          <div className="flex flex-1 overflow-hidden">
            <RequestPane
              method={activeTab.method}
              url={activeTab.url}
              params={state.params}
              headers={state.headers}
              body={state.body}
              onParamsChange={(params) => setTabState(activeTab.id, { params })}
              onHeadersChange={(headers) => setTabState(activeTab.id, { headers })}
              onBodyChange={(body) => setTabState(activeTab.id, { body })}
              onSendToRepeater={() => {
                addTab({
                  name: activeTab.name || activeTab.url || "untitled",
                  method: activeTab.method,
                  url: activeTab.url,
                  params: state.params,
                  headers: state.headers,
                  body: state.body,
                });
              }}
            />
            <div className="w-px bg-border shrink-0" />
            <ResponsePane
              response={state.response}
              onClear={() => setTabState(activeTab.id, { response: { status: "idle" } })}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
