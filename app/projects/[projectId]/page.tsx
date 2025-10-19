import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/dashboard/DashboardClient";
import type { Id } from "@/convex/_generated/dataModel";

interface ProjectPageProps {
  params: Promise<{
    projectId: Id<"projects">;
  }>;
}

const ProjectPage = async ({ params }: ProjectPageProps) => {
  // Protect this route - only authenticated users
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  // Username is required via Clerk configuration
  const userName = user?.username || "User";

  // Await params in Next.js 15
  const { projectId } = await params;

  return <DashboardClient userName={userName} projectId={projectId} />;
};

export default ProjectPage;
