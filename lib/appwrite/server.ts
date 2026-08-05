import { Account, Client, Users, Storage } from "node-appwrite";
import { cookies } from "next/headers";

export const APPWRITE_SESSION_COOKIE = "paperplane_appwrite_session";

function getAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

  if (!endpoint || !projectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }

  return { endpoint, projectId };
}

export function createAppwriteClient() {
  const { endpoint, projectId } = getAppwriteConfig();

  return new Client().setEndpoint(endpoint).setProject(projectId);
}

export function createAppwriteAdminClient() {
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing APPWRITE_API_KEY");
  }

  const client = createAppwriteClient().setKey(apiKey);

  return {
    account: new Account(client),
    users: new Users(client),
    storage: new Storage(client),
  };
}

export async function createAppwriteSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get(APPWRITE_SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const client = createAppwriteClient().setSession(session);

  return {
    account: new Account(client),
    storage: new Storage(client),
  };
}

export async function getCurrentAppwriteUser() {
  const appwrite = await createAppwriteSessionClient();

  if (!appwrite) {
    return null;
  }

  return appwrite.account.get().catch(() => null);
}

export async function setAppwriteSessionCookie(session: {
  secret: string;
  expire: string;
}) {
  const cookieStore = await cookies();

  cookieStore.set(APPWRITE_SESSION_COOKIE, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(session.expire),
    path: "/",
  });
}

export async function clearAppwriteSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(APPWRITE_SESSION_COOKIE);
}
