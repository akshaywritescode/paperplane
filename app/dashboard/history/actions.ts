"use server";

import { ID, Query } from "node-appwrite";
import {
  createAppwriteAdminClient,
  getCurrentAppwriteUser,
} from "@/lib/appwrite/server";
import type { HistoryEntry } from "@/lib/history";
import { DEFAULT_BODY } from "@/app/dashboard/components/RequestEditor/body";

const DB_ID = process.env.APPWRITE_HISTORY_DB_ID!;
const COL_ID = process.env.APPWRITE_HISTORY_COLLECTION_ID!;
const MAX_RESPONSE_BODY = 500_000; // 500 KB cap per document attribute limit

export type SaveHistoryPayload = Omit<HistoryEntry, "id" | "timestamp">;

// ─── WRITE ───────────────────────────────────────────────────────────────────

export async function addHistoryEntryAction(
  payload: SaveHistoryPayload,
): Promise<void> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return;

    const { databases } = createAppwriteAdminClient();

    await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
      userId:             user.$id,
      title:              payload.title || "",
      method:             payload.method,
      url:                payload.url,
      params:             JSON.stringify(payload.params ?? []),
      headers:            JSON.stringify(payload.headers ?? []),
      body:               JSON.stringify(payload.body),
      auth:               JSON.stringify(payload.auth),
      source:             payload.source,
      timestamp:          Date.now(),
      // Response summary — null when the request itself errored
      responseStatusCode: payload.response?.statusCode   ?? null,
      responseStatusText: payload.response?.statusText   ?? null,
      responseTime:       payload.response?.time         ?? null,
      responseSize:       payload.response?.size         ?? null,
      responseHeaders:    payload.response?.headers
        ? JSON.stringify(payload.response.headers)
        : null,
      responseCookies:    payload.response?.cookies
        ? JSON.stringify(payload.response.cookies)
        : null,
      // Full body — capped to avoid exceeding Appwrite attribute size limit
      responseBody:       payload.response?.body
        ? payload.response.body.slice(0, MAX_RESPONSE_BODY)
        : null,
    });
  } catch (err) {
    // Never surface to the user — saving history must never break the workflow
    console.error("[history] Failed to save entry:", err);
  }
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function fetchHistoryAction(): Promise<HistoryEntry[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];

    const { databases } = createAppwriteAdminClient();

    const result = await databases.listDocuments(DB_ID, COL_ID, [
      Query.equal("userId", user.$id),
      Query.orderDesc("timestamp"),
      Query.limit(200),
    ]);

    return result.documents.map(docToEntry);
  } catch (err) {
    console.error("[history] Failed to fetch:", err);
    return [];
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteHistoryEntryAction(
  documentId: string,
): Promise<void> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return;

    const { databases } = createAppwriteAdminClient();
    await databases.deleteDocument(DB_ID, COL_ID, documentId);
  } catch (err) {
    console.error("[history] Failed to delete entry:", err);
  }
}

export async function clearHistoryAction(): Promise<void> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return;

    const { databases } = createAppwriteAdminClient();

    // Paginate-delete until no more documents remain
    let hasMore = true;
    while (hasMore) {
      const result = await databases.listDocuments(DB_ID, COL_ID, [
        Query.equal("userId", user.$id),
        Query.limit(100),
      ]);
      if (result.documents.length === 0) { hasMore = false; break; }
      await Promise.all(
        result.documents.map((d) =>
          databases.deleteDocument(DB_ID, COL_ID, d.$id),
        ),
      );
      hasMore = result.documents.length === 100;
    }
  } catch (err) {
    console.error("[history] Failed to clear:", err);
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function docToEntry(doc: Record<string, any>): HistoryEntry {
  return {
    id:        doc.$id,
    timestamp: doc.timestamp,
    title:     doc.title || "",
    method:    doc.method,
    url:       doc.url,
    params:    safeJson(doc.params,   []),
    headers:   safeJson(doc.headers,  []),
    body:      safeJson(doc.body,     DEFAULT_BODY),
    auth:      safeJson(doc.auth,     { type: "none" }),
    source:    doc.source || "editor",
    response:
      doc.responseStatusCode != null
        ? {
            statusCode: doc.responseStatusCode,
            statusText: doc.responseStatusText ?? "",
            time:       doc.responseTime       ?? 0,
            size:       doc.responseSize       ?? 0,
            headers:    safeJson(doc.responseHeaders, {}),
            cookies:    safeJson(doc.responseCookies, []),
            body:       doc.responseBody       ?? "",
          }
        : undefined,
  };
}

function safeJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try { return JSON.parse(raw) as T; }
  catch { return fallback; }
}
