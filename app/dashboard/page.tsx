import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Protect this route - only authenticated users
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();
  const userName = user?.firstName || user?.username || "User";

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-gray-900">Collab Canvas</h1>

          {/* Toolbar placeholder - will be added in PR #5 */}
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-gray-100 rounded text-sm text-gray-500">
              Tools coming soon...
            </div>
          </div>
        </div>

        {/* Right side - user info */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {userName}!</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center canvas-container bg-gray-100">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎨</div>
          <h2 className="text-2xl font-semibold text-gray-700">Canvas Ready</h2>
          <p className="text-gray-500 max-w-md">
            Your collaborative canvas will appear here. Canvas implementation
            coming in PR #4!
          </p>

          {/* Feature preview cards */}
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm font-medium text-gray-700">Shapes</div>
              <div className="text-xs text-gray-500">Create rectangles</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-sm font-medium text-gray-700">Real-time</div>
              <div className="text-xs text-gray-500">Live collaboration</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-700">Presence</div>
              <div className="text-xs text-gray-500">See who's online</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
