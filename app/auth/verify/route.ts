import { createAppwriteSessionClient } from "@/lib/appwrite/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = "/dashboard";
  redirectTo.search = "";

  if (!userId || !secret) {
    redirectTo.pathname = "/signup";
    redirectTo.searchParams.set("error", "Invalid verification link");
    return NextResponse.redirect(redirectTo);
  }

  const appwrite = await createAppwriteSessionClient();

  if (!appwrite) {
    redirectTo.pathname = "/signup";
    redirectTo.searchParams.set(
      "error",
      "Please sign up again before verifying your email",
    );
    return NextResponse.redirect(redirectTo);
  }

  try {
    await appwrite.account.updateVerification({
      userId,
      secret,
    });
  } catch (error) {
    redirectTo.pathname = "/signup";
    redirectTo.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to verify email",
    );
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.searchParams.set("message", "Email verified. You are signed in.");
  return NextResponse.redirect(redirectTo);
}
