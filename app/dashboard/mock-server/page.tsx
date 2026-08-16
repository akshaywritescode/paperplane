import { getCurrentAppwriteUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";
import { MockServerView } from "./MockServerView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Server",
  description: "Create and manage fake API endpoints.",
};

export default async function MockServerPage() {
  const user = await getCurrentAppwriteUser();
  if (!user) redirect("/login");

  return <MockServerView userId={user.$id} />;
}
