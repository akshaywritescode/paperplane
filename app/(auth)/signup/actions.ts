"use server";

import {
  createAppwriteAdminClient,
  createAppwriteClient,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { OAuthProvider, Account } from "node-appwrite";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ID } from "node-appwrite";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOrigin(headersList: Awaited<ReturnType<typeof headers>>) {
  return (
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}export async function signUp(formData: FormData) {
  const name = getFormValue(formData, "name");
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");
  const headersList = await headers();
  const origin = getOrigin(headersList);

  if (!name || !email || !password) {
    redirect("/signup?error=Please%20fill%20in%20all%20fields");
  }

  if (password.length < 8) {
    redirect("/signup?error=Password%20must%20be%20at%20least%208%20characters");
  }

  const admin = createAppwriteAdminClient();
  let userId = "";

  try {
    const user = await admin.users.create({
      userId: ID.unique(),
      email,
      phone: undefined,
      password,
      name,
    });

    userId = user.$id;
  } catch (error) {
    redirect(
      `/signup?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to create account",
      )}`,
    );
  }

  try {
    const session = await admin.users.createSession({ userId });

    await setAppwriteSessionCookie(session);

    const sessionClient = createAppwriteClient().setSession(session.secret);
    const sessionAccount = new Account(sessionClient);

    await sessionAccount.get();

    await sessionAccount.createVerification({
      url: `${origin}/auth/verify`,
    });
  } catch (error) {
    redirect(
      `/signup?error=${encodeURIComponent(
        error instanceof Error
          ? `Account created, but verification email failed: ${error.message}`
          : "Account created, but verification email failed",
      )}`,
    );
  }

  redirect(
    "/signup?message=Check%20your%20email%20to%20confirm%20your%20account",
  );
}

export async function signUpWithOAuth(formData: FormData) {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "github") {
    redirect("/signup?error=Unsupported%20OAuth%20provider");
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const client = createAppwriteClient();
  const account = new Account(client);

  const oauthProvider =
    provider === "google" ? OAuthProvider.Google : OAuthProvider.Github;

  const redirectUrl = await account.createOAuth2Token({
    provider: oauthProvider,
    success: `${siteUrl}/auth/oauth`,
    failure: `${siteUrl}/signup?error=OAuth%20sign-in%20failed`,
  });

  redirect(redirectUrl);
}
