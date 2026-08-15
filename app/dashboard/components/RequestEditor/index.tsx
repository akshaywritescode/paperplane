"use client";

import { useState } from "react";
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
      headers: Record<string, string>;
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

export function RequestEditor() {
  const [tabs, setTabs] = useState<RequestTab[]>([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [params, setParams] = useState<ParamRow[]>([]);
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  const [body, setBody] = useState<BodyConfig>(DEFAULT_BODY);
  const [auth, setAuth] = useState<AuthConfig>({ type: "none" });
  const [response, setResponse] = useState<ResponseState>({ status: "idle" });
  const { addTab: addRepeaterTab } = useRepeater();
  const router = useRouter();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  function sendToRepeater() {
    addRepeaterTab({
      name: activeTab.name || activeTab.url || "untitled",
      method: activeTab.method,
      url: activeTab.url,
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
    setParams([]);
    setHeaders([]);
    setBody(DEFAULT_BODY);
    setAuth({ type: "none" });
    setResponse({ status: "idle" });
  }

  function closeTab(id: string) {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs[idx === 0 ? 1 : idx - 1];
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (id === activeTabId) setActiveTabId(next.id);
  }

  function updateTab(patch: Partial<RequestTab>) {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, ...patch } : t)),
    );
  }

  async function sendRequest() {
    const url = activeTab.url.trim();
    if (!url) return;

    setResponse({ status: "loading" });

    // Build query string from enabled params
    let finalUrl = url;
    const enabledParams = params.filter((p) => p.enabled && p.name);
    if (enabledParams.length) {
      const qs = enabledParams
        .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
        .join("&");
      finalUrl += (url.includes("?") ? "&" : "?") + qs;
    }

    const reqHeaders: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.name).forEach((h) => {
      reqHeaders[h.name] = h.value;
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
          ...buildBodyPayload(body, activeTab.method),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setResponse({
          status: "error",
          message: data.error ?? "Request failed",
        });
        return;
      }

      setResponse({
        status: "done",
        statusCode: data.statusCode,
        statusText: data.statusText,
        time: data.time,
        size: data.size,
        headers: data.headers,
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
        activeTabId={activeTabId}
        onSelect={setActiveTabId}
        onClose={closeTab}
        onAdd={addTab}
        onRename={(id, name) =>
          setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
        }
      />

      {/* URL bar */}
      <UrlBar
          method={activeTab.method}
          url={activeTab.url}
          loading={response.status === "loading"}
          auth={auth}
          onMethodChange={(method) => updateTab({ method })}
          onUrlChange={(url) => updateTab({ url })}
          onSend={sendRequest}
        />

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
