"use server";

import { ID, Query } from "node-appwrite";
import { createAppwriteAdminClient, getCurrentAppwriteUser } from "@/lib/appwrite/server";
import type { Collection, SavedRequest } from "@/lib/collections";
import { DEFAULT_BODY } from "@/app/dashboard/components/RequestEditor/body";

const DB_ID         = process.env.APPWRITE_COLLECTIONS_DB_ID!;
const COL_COL_ID    = process.env.APPWRITE_COLLECTIONS_COLLECTION_ID!;   // "collections"
const REQ_COL_ID    = process.env.APPWRITE_SAVED_REQUESTS_COLLECTION_ID!; // "saved_requests"

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────

export async function fetchCollectionsAction(): Promise<Collection[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];
    const { databases } = createAppwriteAdminClient();
    const result = await databases.listDocuments(DB_ID, COL_COL_ID, [
      Query.equal("userId", user.$id),
      Query.orderAsc("name"),
      Query.limit(100),
    ]);
    return result.documents.map(docToCollection);
  } catch (e) { console.error("[collections] fetch:", e); return []; }
}

export async function createCollectionAction(
  name: string,
  description = "",
): Promise<Collection | null> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return null;
    const { databases } = createAppwriteAdminClient();
    const doc = await databases.createDocument(DB_ID, COL_COL_ID, ID.unique(), {
      userId: user.$id,
      name: name.trim(),
      description: description.trim(),
      createdAt: Date.now(),
    });
    return docToCollection(doc);
  } catch (e) { console.error("[collections] create:", e); return null; }
}

export async function updateCollectionAction(
  id: string,
  name: string,
  description = "",
): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    await databases.updateDocument(DB_ID, COL_COL_ID, id, {
      name: name.trim(),
      description: description.trim(),
    });
  } catch (e) { console.error("[collections] update:", e); }
}

export async function deleteCollectionAction(id: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    // Delete all requests in this collection first
    let hasMore = true;
    while (hasMore) {
      const result = await databases.listDocuments(DB_ID, REQ_COL_ID, [
        Query.equal("collectionId", id),
        Query.limit(100),
      ]);
      if (result.documents.length === 0) { hasMore = false; break; }
      await Promise.all(result.documents.map(d =>
        databases.deleteDocument(DB_ID, REQ_COL_ID, d.$id)
      ));
      hasMore = result.documents.length === 100;
    }
    await databases.deleteDocument(DB_ID, COL_COL_ID, id);
  } catch (e) { console.error("[collections] delete:", e); }
}

// ─── SAVED REQUESTS ──────────────────────────────────────────────────────────

export async function fetchSavedRequestsAction(collectionId: string): Promise<SavedRequest[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];
    const { databases } = createAppwriteAdminClient();
    const result = await databases.listDocuments(DB_ID, REQ_COL_ID, [
      Query.equal("userId", user.$id),
      Query.equal("collectionId", collectionId),
      Query.orderAsc("name"),
      Query.limit(200),
    ]);
    return result.documents.map(docToRequest);
  } catch (e) { console.error("[collections] fetchRequests:", e); return []; }
}

export async function saveRequestAction(payload: {
  collectionId: string;
  name: string;
  description?: string;
  method: string;
  url: string;
  params: unknown;
  headers: unknown;
  body: unknown;
  auth: unknown;
}): Promise<SavedRequest | null> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return null;
    const { databases } = createAppwriteAdminClient();
    const now = Date.now();
    const doc = await databases.createDocument(DB_ID, REQ_COL_ID, ID.unique(), {
      userId:       user.$id,
      collectionId: payload.collectionId,
      name:         payload.name.trim(),
      description:  (payload.description ?? "").trim(),
      method:       payload.method,
      url:          payload.url,
      params:       JSON.stringify(payload.params ?? []),
      headers:      JSON.stringify(payload.headers ?? []),
      body:         JSON.stringify(payload.body),
      auth:         JSON.stringify(payload.auth),
      createdAt:    now,
      updatedAt:    now,
    });
    return docToRequest(doc);
  } catch (e) { console.error("[collections] saveRequest:", e); return null; }
}

export async function updateSavedRequestAction(
  id: string,
  payload: {
    name?: string;
    description?: string;
    method?: string;
    url?: string;
    params?: unknown;
    headers?: unknown;
    body?: unknown;
    auth?: unknown;
  },
): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (payload.name        !== undefined) patch.name    = payload.name.trim();
    if (payload.description !== undefined) patch.description = payload.description.trim();
    if (payload.method      !== undefined) patch.method  = payload.method;
    if (payload.url         !== undefined) patch.url     = payload.url;
    if (payload.params      !== undefined) patch.params  = JSON.stringify(payload.params);
    if (payload.headers     !== undefined) patch.headers = JSON.stringify(payload.headers);
    if (payload.body        !== undefined) patch.body    = JSON.stringify(payload.body);
    if (payload.auth        !== undefined) patch.auth    = JSON.stringify(payload.auth);
    await databases.updateDocument(DB_ID, REQ_COL_ID, id, patch);
  } catch (e) { console.error("[collections] updateRequest:", e); }
}

export async function deleteSavedRequestAction(id: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    await databases.deleteDocument(DB_ID, REQ_COL_ID, id);
  } catch (e) { console.error("[collections] deleteRequest:", e); }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function docToCollection(doc: Record<string, any>): Collection {
  return {
    id:          doc.$id,
    name:        doc.name,
    description: doc.description ?? "",
    createdAt:   doc.createdAt,
  };
}

function docToRequest(doc: Record<string, any>): SavedRequest {
  return {
    id:           doc.$id,
    collectionId: doc.collectionId,
    name:         doc.name,
    description:  doc.description ?? "",
    method:       doc.method,
    url:          doc.url,
    params:       safeJson(doc.params,   []),
    headers:      safeJson(doc.headers,  []),
    body:         safeJson(doc.body,     DEFAULT_BODY),
    auth:         safeJson(doc.auth,     { type: "none" }),
    createdAt:    doc.createdAt,
    updatedAt:    doc.updatedAt,
  };
}

function safeJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try { return JSON.parse(raw) as T; }
  catch { return fallback; }
}
