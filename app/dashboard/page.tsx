import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  // Protect this route - only authenticated users
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  const userName = user?.firstName || user?.username || "User";

  return <DashboardClient userName={userName} />;
}
