"use server";

import { ID, Query } from "node-appwrite";
import {
  createAppwriteAdminClient,
  getCurrentAppwriteUser,
} from "@/lib/appwrite/server";
import type { MockEndpoint, HttpMethod } from "@/lib/mocks";

const DB_ID  = process.env.APPWRITE_MOCKS_DB_ID!;
const COL_ID = process.env.APPWRITE_MOCKS_COLLECTION_ID!;

// ─── FETCH ────────────────────────────────────────────────────────────────────

export async function fetchMockEndpointsAction(): Promise<MockEndpoint[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];
    const { databases } = createAppwriteAdminClient();
    const res = await databases.listDocuments(DB_ID, COL_ID, [
      Query.equal("userId", user.$id),
      Query.orderDesc("createdAt"),
      Query.limit(200),
    ]);
    return res.documents.map(docToEndpoint);
  } catch (e) {
    console.error("[mocks] fetch:", e);
    return [];
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createMockEndpointAction(payload: {
  path: string;
  method: HttpMethod;
  statusCode: number;
  responseBody: string;
  description?: string;
}): Promise<MockEndpoint | null> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return null;
    const { databases } = createAppwriteAdminClient();
    const now = Date.now();
    const doc = await databases.createDocument(DB_ID, COL_ID, ID.unique(), {
      userId:       user.$id,
      path:         normalizePath(payload.path),
      method:       payload.method,
      statusCode:   payload.statusCode,
      responseBody: payload.responseBody,
      description:  (payload.description ?? "").trim(),
      createdAt:    now,
      updatedAt:    now,
    });
    return docToEndpoint(doc);
  } catch (e) {
    console.error("[mocks] create:", e);
    return null;
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateMockEndpointAction(
  id: string,
  payload: {
    path?: string;
    method?: HttpMethod;
    statusCode?: number;
    responseBody?: string;
    description?: string;
  },
): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (payload.path         !== undefined) patch.path         = normalizePath(payload.path);
    if (payload.method       !== undefined) patch.method       = payload.method;
    if (payload.statusCode   !== undefined) patch.statusCode   = payload.statusCode;
    if (payload.responseBody !== undefined) patch.responseBody = payload.responseBody;
    if (payload.description  !== undefined) patch.description  = payload.description.trim();
    await databases.updateDocument(DB_ID, COL_ID, id, patch);
  } catch (e) {
    console.error("[mocks] update:", e);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteMockEndpointAction(id: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    await databases.deleteDocument(DB_ID, COL_ID, id);
  } catch (e) {
    console.error("[mocks] delete:", e);
  }
}

// ─── PUBLIC LOOKUP (no auth required) ────────────────────────────────────────
// Used by the public /mock/[userId]/[...path] route handler.

export async function findMockEndpointAction(
  userId: string,
  path: string,
  method: string,
): Promise<MockEndpoint | null> {
  try {
    const { databases } = createAppwriteAdminClient();
    const normalPath = normalizePath(path);
    // Match exact method or ANY
    const res = await databases.listDocuments(DB_ID, COL_ID, [
      Query.equal("userId", userId),
      Query.equal("path", normalPath),
      Query.limit(10),
    ]);
    if (!res.documents.length) return null;
    // Prefer exact method match over ANY
    const exactMatch = res.documents.find(
      (d) => d.method === method.toUpperCase(),
    );
    const anyMatch = res.documents.find((d) => d.method === "ANY");
    const doc = exactMatch ?? anyMatch ?? null;
    return doc ? docToEndpoint(doc) : null;
  } catch (e) {
    console.error("[mocks] find:", e);
    return null;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function normalizePath(raw: string): string {
  // Strip leading/trailing slashes, collapse multiples → "todos/1"
  return raw.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/").toLowerCase();
}

function docToEndpoint(d: Record<string, any>): MockEndpoint {
  return {
    id:           d.$id,
    userId:       d.userId,
    path:         d.path,
    method:       d.method,
    statusCode:   d.statusCode,
    responseBody: d.responseBody,
    description:  d.description ?? "",
    createdAt:    d.createdAt,
    updatedAt:    d.updatedAt,
  };
}
