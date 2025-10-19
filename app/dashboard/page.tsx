import { redirect } from "next/navigation";

const DashboardPage = async () => {
  // Redirect old dashboard route to projects list
  redirect("/projects");
};

export default DashboardPage;
