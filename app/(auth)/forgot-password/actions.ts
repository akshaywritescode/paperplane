"use server";

import { createAppwriteClient } from "@/lib/appwrite/server";
import { Account } from "node-appwrite";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requestPasswordReset(formData: FormData) {
  const email =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim()
      : "";

  if (!email) {
    redirect("/forgot-password?error=Please%20enter%20your%20email");
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const siteUrl = origin.replace(/\/$/, "");

  const account = new Account(createAppwriteClient());

  try {
    await account.createRecovery({
      email,
      url: `${siteUrl}/auth/reset-password`,
    });
  } catch (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to send reset email",
      )}`,
    );
  }

  redirect(
    "/forgot-password?message=Check%20your%20email%20for%20a%20reset%20link",
  );
}
