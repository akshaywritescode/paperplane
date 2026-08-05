"use server";

import { createAppwriteClient } from "@/lib/appwrite/server";
import { Account } from "node-appwrite";
import { redirect } from "next/navigation";

export async function resetPassword(formData: FormData) {
  const userId =
    typeof formData.get("userId") === "string"
      ? (formData.get("userId") as string).trim()
      : "";
  const secret =
    typeof formData.get("secret") === "string"
      ? (formData.get("secret") as string).trim()
      : "";
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string).trim()
      : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string"
      ? (formData.get("confirmPassword") as string).trim()
      : "";

  if (!userId || !secret) {
    redirect("/login?error=Invalid%20or%20expired%20reset%20link");
  }

  if (!password || password.length < 8) {
    redirect(
      `/auth/reset-password?userId=${userId}&secret=${secret}&error=Password%20must%20be%20at%20least%208%20characters`,
    );
  }

  if (password !== confirmPassword) {
    redirect(
      `/auth/reset-password?userId=${userId}&secret=${secret}&error=Passwords%20do%20not%20match`,
    );
  }

  const account = new Account(createAppwriteClient());

  try {
    await account.updateRecovery({ userId, secret, password });
  } catch (error) {
    redirect(
      `/auth/reset-password?userId=${userId}&secret=${secret}&error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to reset password",
      )}`,
    );
  }

  redirect("/login?message=Password%20reset%20successfully.%20Please%20log%20in.");
}
