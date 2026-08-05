"use server";

import {
  clearAppwriteSessionCookie,
  createAppwriteSessionClient,
} from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export async function logOut() {
  const appwrite = await createAppwriteSessionClient();

  if (appwrite) {
    await appwrite.account.deleteSession({ sessionId: "current" }).catch(() => {
      // If Appwrite already invalidated the session, still clear the local cookie.
    });
  }

  await clearAppwriteSessionCookie();
  redirect("/login?message=Logged%20out");
}
