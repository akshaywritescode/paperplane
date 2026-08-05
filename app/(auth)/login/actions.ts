"use server";

import {
  createAppwriteAdminClient,
  createAppwriteClient,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { OAuthProvider, Account } from "node-appwrite";
import { redirect } from "next/navigation";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
  // confirm the credentials are valid and to get the userId.
  const account = new Account(createAppwriteClient());
  let userId: string;

  let sessionSecret: string;
  try {
    const session = await account.createEmailPasswordSession({ email, password });
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const account = new Account(createAppwriteClient());

  const oauthProvider =
    provider === "google" ? OAuthProvider.Google : OAuthProvider.Github;

  const redirectUrl = await account.createOAuth2Token({
    provider: oauthProvider,
    success: `${siteUrl}/auth/oauth`,
    failure: `${siteUrl}/login?error=OAuth%20sign-in%20failed`,
  });

  redirect(redirectUrl);
}
