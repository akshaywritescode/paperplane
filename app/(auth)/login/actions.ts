"use server";

import {
  createAppwriteAdminClient,
  createAppwriteClient,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { OAuthProvider, Account } from "node-appwrite";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function getSiteUrl() {
  const headersList = await headers();
  return (
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function logIn(formData: FormData) {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Please%20fill%20in%20all%20fields");
  }

  // Step 1: verify credentials with a regular client session.
  // createEmailPasswordSession returns a session whose `secret` is only
  // populated when called with an API key. We use this call purely to
  let userId: string;
  let sessionSecret: string;
  try {
    const admin = createAppwriteAdminClient();
    const session = await admin.account.createEmailPasswordSession(email, password);
    userId = session.userId;
    sessionSecret = session.secret;
    await setAppwriteSessionCookie(session);
  } catch (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to log in",
      )}`,
    );
  }

  let requiresMfa = false;
  try {
    const sessionClient = new Account(createAppwriteClient().setSession(sessionSecret));
    await sessionClient.get();
  } catch (error: any) {
    if (error?.type === "user_more_factors_required") {
      requiresMfa = true;
    } else {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (requiresMfa) {
    redirect("/login/mfa");
  } else {
    try {
      const admin = createAppwriteAdminClient();
      const adminSession = await admin.users.createSession({ userId: userId! });
      await setAppwriteSessionCookie(adminSession);
    } catch (error) {
      redirect(
        `/login?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unable to create session",
        )}`,
      );
    }
    redirect("/dashboard");
  }
}

export async function logInWithOAuth(formData: FormData) {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "github") {
    redirect("/login?error=Unsupported%20OAuth%20provider");
  }

  const oauthProvider =
    provider === "google" ? OAuthProvider.Google : OAuthProvider.Github;

  let redirectUrl: string;
  try {
    const siteUrl = await getSiteUrl();
    const account = new Account(createAppwriteClient());

    redirectUrl = await account.createOAuth2Token({
      provider: oauthProvider,
      success: `${siteUrl}/auth/oauth`,
      failure: `${siteUrl}/login?error=OAuth%20sign-in%20failed`,
    });
  } catch (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        getErrorMessage(error, "OAuth sign-in failed"),
      )}`,
    );
  }

  redirect(redirectUrl);
}
