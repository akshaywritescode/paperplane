"use server";

import {
  createAppwriteSessionClient,
  createAppwriteAdminClient,
  setAppwriteSessionCookie,
} from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { AuthenticationFactor } from "node-appwrite";

export async function verifyLoginMfa(formData: FormData) {
  const code = formData.get("code") as string;
  if (!code) {
    redirect("/login/mfa?error=Code%20is%20required");
  }

  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) {
    redirect("/login?error=Session%20expired");
  }

  try {
    const challenge = await appwrite.account.createMFAChallenge(AuthenticationFactor.Totp);
    await appwrite.account.updateMFAChallenge(challenge.$id, code);

    // If we reach here, MFA is satisfied. The session is fully verified on the backend.
  } catch (error: any) {
    redirect(
      `/login/mfa?error=${encodeURIComponent(
        error.message || "Invalid verification code"
      )}`
    );
  }

  redirect("/dashboard");
}

export async function cancelMfaLogin() {
  const appwrite = await createAppwriteSessionClient();
  if (appwrite) {
    try {
      await appwrite.account.deleteSession('current');
    } catch (e) {
      // Ignore errors if session is already invalid
    }
  }
  
  const { clearAppwriteSessionCookie } = await import("@/lib/appwrite/server");
  await clearAppwriteSessionCookie();
  
  redirect("/login");
}
