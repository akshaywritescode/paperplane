"use server";

import { createAppwriteSessionClient } from "@/lib/appwrite/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ID, AuthenticatorType } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

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

export async function updateProfileName(formData: FormData): Promise<never> {
  const name = getFormValue(formData, "name");

  if (!name) {
    redirect("/dashboard/settings/profile?error=Name%20is%20required");
  }

  const account = await requireAccount();

  let isError = false;
  let message = "";

  try {
    await account.updateName({ name });
    message = "Name updated successfully";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to update name";
  }

  if (isError) {
    redirect(`/dashboard/settings/profile?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/profile?message=${encodeURIComponent(message)}`);
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
    const origin = await getOrigin();
    await account.createEmailVerification({ url: `${origin}/auth/verify` });
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

export async function resendEmailVerification(): Promise<never> {
  const account = await requireAccount();
  const origin = await getOrigin();

  let isError = false;
  let message = "";

  try {
    await account.createEmailVerification({ url: `${origin}/auth/verify` });
    message = "Verification email sent. Check your inbox.";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to send verification email";
  }

  if (isError) {
    redirect(`/dashboard/settings/profile?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/profile?message=${encodeURIComponent(message)}`);
  }
}

export async function updatePassword(formData: FormData): Promise<never> {
  const password = getFormValue(formData, "password");
  const confirmPassword = getFormValue(formData, "confirmPassword");
  const oldPassword = getFormValue(formData, "oldPassword");

  if (!password || password.length < 8) {
    redirect("/dashboard/settings/security?error=Password%20must%20be%20at%20least%208%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/dashboard/settings/security?error=Passwords%20do%20not%20match");
  }

  const account = await requireAccount();

  let isError = false;
  let message = "";

  try {
    await account.updatePassword(password, oldPassword || undefined);
    message = "Password updated successfully";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to update password";
  }

  if (isError) {
    redirect(`/dashboard/settings/security?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/security?message=${encodeURIComponent(message)}`);
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

export async function updateProfileAvatar(formData: FormData): Promise<never> {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) {
    redirect("/dashboard/settings/profile?error=No%20file%20provided");
  }

  if (!file.type.startsWith("image/")) {
    redirect("/dashboard/settings/profile?error=File%20must%20be%20an%20image");
  }

  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) redirect("/login?error=Please%20log%20in%20first");

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID;
  if (!bucketId) {
    redirect("/dashboard/settings/profile?error=Avatars%20bucket%20not%20configured");
  }

  let isError = false;
  let message = "";

  try {
    const user = await appwrite.account.get();
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const inputFile = InputFile.fromBuffer(buffer, file.name);

    const uploadedFile = await appwrite.storage.createFile(
      bucketId,
      ID.unique(),
      inputFile
    );

    const newPrefs = { ...user.prefs, avatarId: uploadedFile.$id };
    await appwrite.account.updatePrefs(newPrefs);

    if (user.prefs.avatarId) {
      try {
        await appwrite.storage.deleteFile(bucketId, user.prefs.avatarId);
      } catch (e) {}
    }

    message = "Profile picture updated successfully";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to upload profile picture";
  }

  if (isError) {
    redirect(`/dashboard/settings/profile?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/profile?message=${encodeURIComponent(message)}`);
  }
}

export async function deleteProfileAvatar(): Promise<never> {
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) redirect("/login?error=Please%20log%20in%20first");

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID;

  let isError = false;
  let message = "";

  try {
    const user = await appwrite.account.get();
    
    if (user.prefs.avatarId && bucketId) {
      try {
        await appwrite.storage.deleteFile(bucketId, user.prefs.avatarId);
      } catch (e) {}
      
      const newPrefs = { ...user.prefs };
      delete newPrefs.avatarId;
      await appwrite.account.updatePrefs(newPrefs);
      message = "Profile picture removed successfully";
    } else {
      isError = true;
      message = "No profile picture to remove";
    }
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to remove profile picture";
  }

  if (isError) {
    redirect(`/dashboard/settings/profile?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/profile?message=${encodeURIComponent(message)}`);
  }
}

export async function setupTotp() {
  const account = await requireAccount();
  try {
    const authenticator = await account.createMFAAuthenticator(AuthenticatorType.Totp);
    return { success: true, uri: authenticator.uri, secret: authenticator.secret };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to setup TOTP" };
  }
}

export async function verifyTotp(formData: FormData): Promise<never> {
  const code = getFormValue(formData, "code");
  if (!code) {
    redirect("/dashboard/settings/security?error=Verification%20code%20is%20required");
  }

  const account = await requireAccount();
  let isError = false;
  let message = "";

  try {
    await account.updateMFAAuthenticator({ type: AuthenticatorType.Totp, otp: code });
    await account.updateMFA({ mfa: true });
    message = "Two-Factor Authentication enabled successfully!";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Invalid verification code";
  }

  if (isError) {
    redirect(`/dashboard/settings/security?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/security?message=${encodeURIComponent(message)}`);
  }
}

export async function disableTotp(): Promise<never> {
  const account = await requireAccount();
  let isError = false;
  let message = "";

  try {
    try {
      await account.deleteMFAAuthenticator({ type: AuthenticatorType.Totp });
    } catch {
      // already deleted — continue
    }
    await account.updateMFA({ mfa: false });
    message = "Two-Factor Authentication disabled";
  } catch (error) {
    isError = true;
    message = error instanceof Error ? error.message : "Unable to disable 2FA";
  }

  if (isError) {
    redirect(`/dashboard/settings/security?error=${encodeURIComponent(message)}`);
  } else {
    redirect(`/dashboard/settings/security?message=${encodeURIComponent(message)}`);
  }
}

export async function generateRecoveryCodes() {
  const account = await requireAccount();
  try {
    // Try creating first; if codes already exist Appwrite throws — then regenerate
    let result;
    try {
      result = await account.createMFARecoveryCodes();
    } catch {
      result = await account.updateMFARecoveryCodes();
    }
    return { success: true, codes: result.recoveryCodes };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unable to generate recovery codes" };
  }
}

export async function revokeSession(sessionId: string): Promise<ActionResult> {
  const appwrite = await createAppwriteSessionClient();
  if (!appwrite) return { success: false, message: "Not authenticated" };

  try {
    await appwrite.account.deleteSession({ sessionId });
    return { success: true, message: "Session revoked" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to revoke session",
    };
  }
}
