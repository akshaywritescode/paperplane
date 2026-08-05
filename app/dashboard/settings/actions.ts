"use server";

import { createAppwriteSessionClient } from "@/lib/appwrite/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ActionResult = { success: boolean; message: string };

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getOrigin() {
  const headersList = await headers();
  return (
    headersList.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

async function requireAccount() {
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) redirect("/login?error=Please%20log%20in%20first");
  return appwrite.account;
}

export async function updateProfileName(formData: FormData): Promise<ActionResult> {
  const name = getFormValue(formData, "name");

  if (!name) {
    return { success: false, message: "Name is required" };
  }

  const account = await requireAccount();

  try {
    await account.updateName({ name });
    return { success: true, message: "Name updated successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update name",
    };
  }
}

export async function updateProfileEmail(formData: FormData): Promise<never> {
  const email = getFormValue(formData, "email");
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect("/dashboard/settings/profile?error=Email%20and%20current%20password%20are%20required");
  }

  const account = await requireAccount();

  let isError = false;
  let message = "";

  try {
    await account.updateEmail({ email, password });
    message = "Email updated. Check your inbox to verify your new address.";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to update email";
  }

  if (isError) {
    redirect(`/dashboard/settings/profile?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/profile?message=${encodeURIComponent(message)}`);
  }
}

export async function resendEmailVerification(): Promise<ActionResult> {
  const account = await requireAccount();
  const origin = await getOrigin();

  try {
    await account.createEmailVerification({ url: `${origin}/auth/verify` });
    return { success: true, message: "Verification email sent. Check your inbox." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to send verification email",
    };
  }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmPassword");
  const oldPassword = getFormValue(formData, "oldPassword");

  if (!password || password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" };
  }

  const account = await requireAccount();

  try {
    await account.updatePassword({ password, oldPassword: oldPassword || undefined });
    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update password",
    };
  }
}

export async function sendPasswordResetEmail(): Promise<ActionResult> {
  const account = await requireAccount();
  const origin = await getOrigin();

  let userEmail: string;
  try {
    const user = await account.get();
    userEmail = user.email;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to load account",
    };
  }

  try {
    await account.createRecovery({ email: userEmail, url: `${origin}/auth/reset-password` });
    return { success: true, message: "Password reset link sent to your email." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to send password reset email",
    };
  }
}
