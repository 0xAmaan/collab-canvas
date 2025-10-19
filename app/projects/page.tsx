import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProjectsClient } from "./ProjectsClient";

const ProjectsPage = async () => {
  // Protect this route - only authenticated users
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  const userName = user?.username || "User";

  return <ProjectsClient />;
};

export default ProjectsPage;
