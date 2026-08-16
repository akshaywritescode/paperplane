"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "./TabBar";
import { UrlBar } from "./UrlBar";
import { RequestPane } from "./RequestPane";
import { ResponsePane } from "./ResponsePane";
import { useRepeater } from "../../context/RepeaterContext";
import { buildAuthHeader, buildAuthQueryParam } from "./auth";
import type { AuthConfig } from "./auth";
import { DEFAULT_BODY, hasBodyContent } from "./body";
import type { BodyConfig } from "./body";
import { addHistoryEntryAction } from "@/app/dashboard/history/actions";
import {
  fetchCollectionsAction,
  createCollectionAction,
  saveRequestAction,
} from "@/app/dashboard/collections/actions";
import type { Collection } from "@/lib/collections";
import { BookmarkPlus, X, Loader2, FolderPlus } from "lucide-react";
import { useEnvironment } from "../../context/EnvironmentContext";
import { useLocalStorage } from "@/lib/use-local-storage";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type RequestTab = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
};

export type ParamRow = { id: string; enabled: boolean; name: string; value: string };
export type HeaderRow = { id: string; enabled: boolean; name: string; value: string };
export type { AuthConfig } from "./auth";
export type { BodyConfig, FormField, MultipartField, RawContentType } from "./body";

export type ResponseState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      statusCode: number;
      statusText: string;
      time: number;
      size: number;
      /** True when the response body was cut off at the 5 MB proxy limit. */
      truncated?: boolean;
      /** Full byte count of the original response (only present when truncated). */
      fullSize?: number;
      headers: Record<string, string>;
      cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
        expires?: string;
        maxAge?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: string;
      }>;
      redirects?: Array<{
        statusCode: number;
        statusText: string;
        location: string;
        headers: Record<string, string>;
      }>;
      body: string;
    }
  | { status: "error"; message: string };

const DEFAULT_TAB: RequestTab = {
  id: "1",
  name: "untitled",
  method: "GET",
  url: "",
};

/** Build the proxy payload fields for the body config */
function buildBodyPayload(body: BodyConfig, method: HttpMethod) {
  const METHODS_WITH_BODY = ["POST", "PUT", "PATCH", "DELETE"];
  if (!METHODS_WITH_BODY.includes(method) || !hasBodyContent(body)) return {};

  if (body.type === "raw") {
    return { bodyType: "raw", rawBody: body.content, rawContentType: body.contentType };
  }
  if (body.type === "form") {
    return {
      bodyType: "form",
      formFields: body.fields
        .filter((f) => f.enabled && f.name)
        .map((f) => ({ name: f.name, value: f.value, enabled: true })),
    };
  }
  if (body.type === "multipart") {
    return {
      bodyType: "multipart",
      multipartFields: body.fields
        .filter((f) => f.enabled && f.name)
        .map((f) =>
          f.isFile
            ? { name: f.name, isFile: true, fileName: f.fileName, fileType: f.fileType, fileData: f.fileData, enabled: true }
            : { name: f.name, isFile: false, value: f.value, enabled: true },
        ),
    };
  }
  return {};
}

// ─── Save to Collection modal ────────────────────────────────────────────────
function SaveToCollectionButton({
  method, url, tabName, params, headers, body, auth,
}: {
  method: HttpMethod; url: string; tabName: string;
  params: ParamRow[]; headers: HeaderRow[]; body: BodyConfig; auth: AuthConfig;
}) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [selectedColId, setSelectedColId] = useState<string>("");
  const [newColName, setNewColName] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleOpen() {
    setOpen(true);
    setSaved(false);
    setName(tabName !== "untitled" ? tabName : url ? url.split("/").pop() || "" : "");
    setLoading(true);
    const cols = await fetchCollectionsAction();
    setCollections(cols);
    setSelectedColId(cols[0]?.id ?? "");
    setLoading(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  async function handleCreateCollection() {
    if (!newColName.trim()) return;
    setCreatingCol(true);
    const col = await createCollectionAction(newColName.trim());
    if (col) {
      setCollections(prev => [...prev, col]);
      setSelectedColId(col.id);
      setNewColName("");
    }
    setCreatingCol(false);
  }

  async function handleSave() {
    if (!name.trim() || !selectedColId) return;
    setSaving(true);
    await saveRequestAction({
      collectionId: selectedColId,
      name: name.trim(),
      method, url, params, headers, body, auth,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setOpen(false); setSaved(false); }, 900);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Save to collection"
        className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <BookmarkPlus className="size-3.5" />
        <span className="hidden sm:inline">Save</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Save to Collection</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Request name */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Request name</label>
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    placeholder="Get users"
                    className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
                  />
                </div>

                {/* Collection picker */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Collection</label>
                  {collections.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic mb-2">No collections yet — create one below.</p>
                  ) : (
                    <select
                      value={selectedColId}
                      onChange={e => setSelectedColId(e.target.value)}
                      className="w-full rounded-md border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-orange-400"
                    >
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Quick create collection */}
                <div className="flex gap-2">
                  <input
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateCollection()}
                    placeholder="New collection name…"
                    className="flex-1 rounded-md border bg-muted/30 px-3 py-1.5 text-xs outline-none transition focus:border-orange-400"
                  />
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newColName.trim() || creatingCol}
                    className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs transition hover:bg-muted disabled:opacity-40"
                  >
                    {creatingCol ? <Loader2 className="size-3 animate-spin" /> : <FolderPlus className="size-3" />}
                    Create
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-md border px-3 py-2 text-xs transition hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || !selectedColId || saving || saved}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="size-3 animate-spin" />}
                    {saved ? "✓ Saved!" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function RequestEditor() {

  // ── Per-tab state map ────────────────────────────────────────────────────
  // Each tab has its own params/headers/body/auth/response, stored in a map
  // keyed by tab ID. This is persisted to localStorage so tabs survive refresh.

  type TabState = {
    params:   ParamRow[];
    headers:  HeaderRow[];
    body:     BodyConfig;
    auth:     AuthConfig;
    response: ResponseState;
  };

  const DEFAULT_TAB_STATE: TabState = {
    params:   [],
    headers:  [],
    body:     DEFAULT_BODY,
    auth:     { type: "none" },
    response: { status: "idle" },
  };

  // Persist tab list + active tab
  const [tabs, setTabs] = useLocalStorage<RequestTab[]>(
    "pp_editor_tabs",
    [DEFAULT_TAB],
  );
  const [activeTabId, setActiveTabId] = useLocalStorage<string>(
    "pp_editor_active",
    "1",
  );

  // Persist per-tab state map (params/headers/body/auth)
  const [tabStates, setTabStates] = useLocalStorage<Record<string, Omit<TabState, "response">>>(
    "pp_editor_tab_states",
    {},
  );

  // Persist last response per tab — body capped at 100 KB to stay within
  // localStorage quota (~5 MB origin limit). Large responses are still visible
  // during the session via the in-memory overlay below.
  const RESPONSE_BODY_CAP = 100 * 1024; // 100 KB
  const [persistedResponses, setPersistedResponses] = useLocalStorage<Record<string, ResponseState>>(
    "pp_editor_responses",
    {},
  );
  // In-memory overlay for the current session — holds the full body even when
  // it exceeds the cap, so you always see the complete response while the page is open.
  const [sessionResponses, setSessionResponses] = useState<Record<string, ResponseState>>({});

  const { addTab: addRepeaterTab } = useRepeater();
  const router = useRouter();

  // Ensure activeTabId is valid after restore (tab might have been deleted)
  const validActiveTabId = tabs.find((t) => t.id === activeTabId)
    ? activeTabId
    : tabs[0]?.id ?? "1";

  const activeTab = tabs.find((t) => t.id === validActiveTabId) ?? tabs[0];

  function getTabState(id: string): TabState {
    const saved = tabStates[id];
    // Session response takes priority (full body); fall back to persisted (may be capped)
    const response = sessionResponses[id] ?? persistedResponses[id] ?? { status: "idle" };
    return {
      params:   saved?.params   ?? [],
      headers:  saved?.headers  ?? [],
      body:     saved?.body     ?? DEFAULT_BODY,
      auth:     saved?.auth     ?? { type: "none" },
      response,
    };
  }

  function setTabStateField<K extends keyof TabState>(
    id: string,
    key: K,
    value: TabState[K],
  ) {
    if (key === "response") {
      const r = value as ResponseState;
      // Always store full response in session memory
      setSessionResponses((prev) => ({ ...prev, [id]: r }));
      // Store a capped version in localStorage
      if (r.status === "done") {
        const body = r.body ?? "";
        const capped = body.length > RESPONSE_BODY_CAP;
        setPersistedResponses((prev) => ({
          ...prev,
          [id]: {
            ...r,
            body: capped ? body.slice(0, RESPONSE_BODY_CAP) : body,
            ...(capped && { truncated: true, fullSize: r.fullSize ?? new Blob([body]).size }),
          },
        }));
      } else {
        // For idle/loading/error states persist as-is
        setPersistedResponses((prev) => ({ ...prev, [id]: r }));
      }
    } else {
      setTabStates((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? {}), [key]: value },
      }));
    }
  }

  const state   = getTabState(validActiveTabId);
  const params  = state.params;
  const headers = state.headers;
  const body    = state.body;
  const auth    = state.auth;
  const response = state.response;

  const setParams  = (v: ParamRow[])  => setTabStateField(validActiveTabId, "params",  v);
  const setHeaders = (v: HeaderRow[]) => setTabStateField(validActiveTabId, "headers", v);
  const setBody    = (v: BodyConfig)  => setTabStateField(validActiveTabId, "body",    v);
  const setAuth    = (v: AuthConfig)  => setTabStateField(validActiveTabId, "auth",    v);
  const setResponse = (v: ResponseState) => setTabStateField(validActiveTabId, "response", v);

  // Restore from history (sessionStorage written by the history page)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("paperplane_restore");
      if (!raw) return;
      sessionStorage.removeItem("paperplane_restore");
      const entry = JSON.parse(raw);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === validActiveTabId
            ? { ...t, method: entry.method, url: entry.url, name: entry.title || "untitled" }
            : t,
        ),
      );
      if (entry.params)  setParams(entry.params);
      if (entry.headers) setHeaders(entry.headers);
      if (entry.body)    setBody(entry.body);
      if (entry.auth)    setAuth(entry.auth);
      if (entry.response) {
        setResponse({
          status:     "done",
          statusCode: entry.response.statusCode,
          statusText: entry.response.statusText,
          time:       entry.response.time,
          size:       entry.response.size,
          headers:    entry.response.headers,
          cookies:    entry.response.cookies || [],
          redirects:  entry.response.redirects,
          body:       entry.response.body,
        });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sendToRepeater() {
    addRepeaterTab({
      name:    activeTab.name || activeTab.url || "untitled",
      method:  activeTab.method,
      url:     activeTab.url,
      params,
      headers,
      body,
      auth,
    });
    router.push("/dashboard/repeater");
  }

  function addTab() {
    const id = crypto.randomUUID();
    const newTab: RequestTab = { id, name: "untitled", method: "GET", url: "" };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
    // tabStates entry will be created lazily via getTabState defaults
  }

  function closeTab(id: string) {
    if (tabs.length === 1) return;
    const idx  = tabs.findIndex((t) => t.id === id);
    const next = tabs[idx === 0 ? 1 : idx - 1];
    setTabs((prev) => prev.filter((t) => t.id !== id));
    // Clean up persisted state for the closed tab
    setTabStates((prev) => { const c = { ...prev }; delete c[id]; return c; });
    setPersistedResponses((prev) => { const c = { ...prev }; delete c[id]; return c; });
    setSessionResponses((prev) => { const c = { ...prev }; delete c[id]; return c; });
    if (id === validActiveTabId) setActiveTabId(next.id);
  }

  function updateTab(patch: Partial<RequestTab>) {
    setTabs((prev) =>
      prev.map((t) => (t.id === validActiveTabId ? { ...t, ...patch } : t)),
    );
  }

  const { interpolate } = useEnvironment();

  async function sendRequest() {
    const url = interpolate(activeTab.url.trim());
    if (!url) return;

    setResponse({ status: "loading" });

    // Build query string from enabled params (with interpolation)
    let finalUrl = url;
    const enabledParams = params.filter((p) => p.enabled && p.name);
    if (enabledParams.length) {
      const qs = enabledParams
        .map((p) => `${encodeURIComponent(interpolate(p.name))}=${encodeURIComponent(interpolate(p.value))}`)
        .join("&");
      finalUrl += (url.includes("?") ? "&" : "?") + qs;
    }

    const reqHeaders: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.name).forEach((h) => {
      reqHeaders[interpolate(h.name)] = interpolate(h.value);
    });

    // Merge auth credentials into headers
    Object.assign(reqHeaders, buildAuthHeader(auth));

    // API Key → Query Param: append before the fetch
    const authQp = buildAuthQueryParam(auth);
    if (authQp) {
      finalUrl +=
        (finalUrl.includes("?") ? "&" : "?") +
        `${encodeURIComponent(authQp.key)}=${encodeURIComponent(authQp.value)}`;
    }

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: finalUrl,
          method: activeTab.method,
          headers: reqHeaders,
          ...buildBodyPayload(
            body.type === "raw"
              ? { ...body, content: interpolate(body.content) }
              : body,
            activeTab.method,
          ),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        // Fire-and-forget: never await history writes
        addHistoryEntryAction({
          title:   activeTab.name !== "untitled" ? activeTab.name : "",
          method:  activeTab.method,
          url:     activeTab.url,
          params,
          headers,
          body,
          auth,
          source:  "editor",
        });
        setResponse({
          status: "error",
          message: data.error ?? "Request failed",
        });
        return;
      }

      // Fire-and-forget history write with full response
      addHistoryEntryAction({
        title:   activeTab.name !== "untitled" ? activeTab.name : "",
        method:  activeTab.method,
        url:     activeTab.url,
        params,
        headers,
        body,
        auth,
        source:  "editor",
        response: {
          statusCode: data.statusCode,
          statusText: data.statusText,
          time:       data.time,
          size:       data.size,
          headers:    data.headers,
          cookies:    data.cookies || [],
          redirects:  data.redirects || [],
          body:       data.body,
        },
      });
      setResponse({
        status: "done",
        statusCode: data.statusCode,
        statusText: data.statusText,
        time: data.time,
        size: data.size,
        ...(data.truncated && { truncated: true, fullSize: data.fullSize }),
        headers: data.headers,
        cookies: data.cookies || [],
        redirects: data.redirects,
        body: data.body,
      });
    } catch (err) {
      setResponse({
        status: "error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Tab bar */}
      <TabBar
        tabs={tabs}
        activeTabId={validActiveTabId}
        onSelect={setActiveTabId}
        onClose={closeTab}
        onAdd={addTab}
        onRename={(id, name) =>
          setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
        }
      />

      {/* URL bar row — Send + Save */}
      <div className="flex items-center gap-2 border-b pr-2">
        <div className="flex-1 min-w-0">
          <UrlBar
            method={activeTab.method}
            url={activeTab.url}
            loading={response.status === "loading"}
            auth={auth}
            onMethodChange={(method) => updateTab({ method })}
            onUrlChange={(url) => updateTab({ url })}
            onSend={sendRequest}
          />
        </div>
        <SaveToCollectionButton
          method={activeTab.method}
          url={activeTab.url}
          tabName={activeTab.name}
          params={params}
          headers={headers}
          body={body}
          auth={auth}
        />
      </div>

      {/* Split panes */}
      <div className="flex flex-1 overflow-hidden">
        <RequestPane
          method={activeTab.method}
          url={activeTab.url}
          params={params}
          headers={headers}
          body={body}
          auth={auth}
          onParamsChange={setParams}
          onHeadersChange={setHeaders}
          onBodyChange={setBody}
          onAuthChange={setAuth}
          onSendToRepeater={sendToRepeater}
        />
        <div className="w-px bg-border shrink-0" />
        <ResponsePane response={response} onClear={() => setResponse({ status: "idle" })} url={activeTab.url} />
      </div>
    </div>
  );
}
