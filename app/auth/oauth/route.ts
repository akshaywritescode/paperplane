import {
  createAppwriteAdminClient,
  createAppwriteClient,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { Account } from "node-appwrite";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const fail = (msg: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", msg);
    return NextResponse.redirect(url);
  };

  if (!userId || !secret) {
    return fail("Invalid OAuth callback");
  }

  // Step 1: exchange the OAuth token for a session using the regular client.
  // This validates the userId + secret pair with Appwrite.
  try {
    const account = new Account(createAppwriteClient());
    await account.createSession({ userId, secret });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "OAuth sign-in failed",
    );
  }

  // Step 2: create a privileged session via the admin client so the cookie
  // secret is populated (createSession on a non-admin client returns an
  // empty secret string).
  try {
    const admin = createAppwriteAdminClient();
    const adminSession = await admin.users.createSession({ userId });
    await setAppwriteSessionCookie(adminSession);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "OAuth sign-in failed",
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  url.search = "";
  return NextResponse.redirect(url);
}
