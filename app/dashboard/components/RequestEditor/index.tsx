"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "./TabBar";
import { UrlBar } from "./UrlBar";
import { RequestPane } from "./RequestPane";
import { ResponsePane } from "./ResponsePane";
import { useRepeater } from "../../context/RepeaterContext";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type RequestTab = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
};

export type ParamRow = { id: string; enabled: boolean; name: string; value: string };
export type HeaderRow = { id: string; enabled: boolean; name: string; value: string };

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

export function RequestEditor() {
  const [tabs, setTabs] = useState<RequestTab[]>([DEFAULT_TAB]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [params, setParams] = useState<ParamRow[]>([]);
  const [headers, setHeaders] = useState<HeaderRow[]>([]);
  const [body, setBody] = useState("");
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
    setBody("");
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

    const start = Date.now();

    try {
      const res = await fetch(finalUrl, {
        method: activeTab.method,
        headers: reqHeaders,
        body: ["POST", "PUT", "PATCH"].includes(activeTab.method)
          ? body || undefined
          : undefined,
      });

      const time = Date.now() - start;
      const text = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      setResponse({
        status: "done",
        statusCode: res.status,
        statusText: res.statusText,
        time,
        size: new Blob([text]).size,
        headers: resHeaders,
        body: text,
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
          onParamsChange={setParams}
          onHeadersChange={setHeaders}
          onBodyChange={setBody}
          onSendToRepeater={sendToRepeater}
        />
        <div className="w-px bg-border shrink-0" />
        <ResponsePane
          response={response}
          request={{ tab: activeTab, params, headers, body }}
        />
      </div>
    </div>
  );
}
