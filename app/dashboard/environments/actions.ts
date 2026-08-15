"use server";

import { ID, Query } from "node-appwrite";
import { createAppwriteAdminClient, getCurrentAppwriteUser } from "@/lib/appwrite/server";
import type { Environment, EnvVariable } from "@/lib/environments";

const DB_ID     = process.env.APPWRITE_ENVIRONMENTS_DB_ID!;
const ENV_COL   = process.env.APPWRITE_ENVIRONMENTS_COLLECTION_ID!;
const VARS_COL  = process.env.APPWRITE_ENV_VARIABLES_COLLECTION_ID!;

// ─── ENVIRONMENTS ────────────────────────────────────────────────────────────

export async function fetchEnvironmentsAction(): Promise<Environment[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];
    const { databases } = createAppwriteAdminClient();
    const res = await databases.listDocuments(DB_ID, ENV_COL, [
      Query.equal("userId", user.$id),
      Query.orderAsc("name"),
      Query.limit(50),
    ]);
    return res.documents.map(docToEnv);
  } catch (e) { console.error("[env] fetch:", e); return []; }
}

export async function createEnvironmentAction(name: string): Promise<Environment | null> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return null;
    const { databases } = createAppwriteAdminClient();
    const doc = await databases.createDocument(DB_ID, ENV_COL, ID.unique(), {
      userId: user.$id,
      name: name.trim(),
      isActive: false,
      createdAt: Date.now(),
    });
    return docToEnv(doc);
  } catch (e) { console.error("[env] create:", e); return null; }
}

export async function updateEnvironmentAction(id: string, name: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    await databases.updateDocument(DB_ID, ENV_COL, id, { name: name.trim() });
  } catch (e) { console.error("[env] update:", e); }
}

export async function deleteEnvironmentAction(id: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    // Cascade-delete variables first
    let hasMore = true;
    while (hasMore) {
      const res = await databases.listDocuments(DB_ID, VARS_COL, [
        Query.equal("environmentId", id), Query.limit(100),
      ]);
      if (!res.documents.length) { hasMore = false; break; }
      await Promise.all(res.documents.map(d => databases.deleteDocument(DB_ID, VARS_COL, d.$id)));
      hasMore = res.documents.length === 100;
    }
    await databases.deleteDocument(DB_ID, ENV_COL, id);
  } catch (e) { console.error("[env] delete:", e); }
}

// ─── VARIABLES ───────────────────────────────────────────────────────────────

export async function fetchVariablesAction(environmentId: string): Promise<EnvVariable[]> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return [];
    const { databases } = createAppwriteAdminClient();
    const res = await databases.listDocuments(DB_ID, VARS_COL, [
      Query.equal("userId", user.$id),
      Query.equal("environmentId", environmentId),
      Query.orderAsc("key"),
      Query.limit(200),
    ]);
    return res.documents.map(docToVar);
  } catch (e) { console.error("[env] fetchVars:", e); return []; }
}

export async function upsertVariableAction(payload: {
  id?: string;          // if present → update, else → create
  environmentId: string;
  key: string;
  value: string;
  enabled: boolean;
}): Promise<EnvVariable | null> {
  try {
    const user = await getCurrentAppwriteUser();
    if (!user) return null;
    const { databases } = createAppwriteAdminClient();
    const data = {
      userId: user.$id,
      environmentId: payload.environmentId,
      key: payload.key,
      value: payload.value,
      enabled: payload.enabled,
    };
    const doc = payload.id
      ? await databases.updateDocument(DB_ID, VARS_COL, payload.id, data)
      : await databases.createDocument(DB_ID, VARS_COL, ID.unique(), data);
    return docToVar(doc);
  } catch (e) { console.error("[env] upsertVar:", e); return null; }
}

export async function deleteVariableAction(id: string): Promise<void> {
  try {
    const { databases } = createAppwriteAdminClient();
    await databases.deleteDocument(DB_ID, VARS_COL, id);
  } catch (e) { console.error("[env] deleteVar:", e); }
}

/** Returns the enabled key→value map for an environment — used by the context. */
export async function fetchResolvedVarsAction(
  environmentId: string,
): Promise<Record<string, string>> {
  const vars = await fetchVariablesAction(environmentId);
  return Object.fromEntries(
    vars.filter(v => v.enabled).map(v => [v.key, v.value]),
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function docToEnv(d: Record<string, any>): Environment {
  return { id: d.$id, name: d.name, isActive: d.isActive ?? false, createdAt: d.createdAt };
}
function docToVar(d: Record<string, any>): EnvVariable {
  return { id: d.$id, environmentId: d.environmentId, key: d.key, value: d.value, enabled: d.enabled };
}
