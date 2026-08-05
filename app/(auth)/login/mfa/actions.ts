"use server";

import {
  createAppwriteSessionClient,
  clearAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { AuthenticationFactor } from "node-appwrite";

type ActionResult = { success: boolean; message: string };

export async function verifyLoginMfa(formData: FormData): Promise<ActionResult> {
  const code = formData.get("code") as string;

  if (!code) {
    return { success: false, message: "Code is required" };
  }

  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) {
    return { success: false, message: "Session expired. Please log in again." };
  }

  try {
    const challenge = await appwrite.account.createMFAChallenge({
      factor: AuthenticationFactor.Totp,
    });
    await appwrite.account.updateMFAChallenge({
      challengeId: challenge.$id,
      otp: code,
    });
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Invalid verification code",
    };
  }

  redirect("/dashboard");
}

export async function cancelMfaLogin() {
  const appwrite = await createAppwriteSessionClient();
  if (appwrite) {
    try {
      await appwrite.account.deleteSession({ sessionId: "current" });
    } catch {
      // ignore if already expired
    }
  }

  await clearAppwriteSessionCookie();
  redirect("/login");
}
