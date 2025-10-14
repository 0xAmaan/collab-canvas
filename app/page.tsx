import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";

export default async function Home() {
  // Check if user is already authenticated
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-shift"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Floating orbs for visual interest */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float-slower"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-float"></div>

      {/* Floating Sign In Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <button className="group px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl text-white font-semibold border border-white/20 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer">
            <span className="flex items-center gap-2">
              Sign In
              <svg
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </button>
        </SignInButton>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Main Content */}
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center space-y-8 mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Real-time collaboration
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-white">
                Collab Canvas
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>

            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Experience the future of collaborative design with{" "}
              <span className="text-white font-semibold">
                real-time synchronization
              </span>
              ,{" "}
              <span className="text-white font-semibold">
                multiplayer cursors
              </span>
              , and{" "}
              <span className="text-white font-semibold">lightning-fast</span>{" "}
              interactions
            </p>

            <p className="text-white/50 text-sm mt-8">
              No credit card required • Free forever
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Intuitive Design
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Create rectangles with simple clicks or keyboard shortcuts.
                  Professional tools made effortless.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Live Collaboration
                </h3>
                <p className="text-white/60 leading-relaxed">
                  See cursors, selections, and changes from every team member in
                  real-time. True multiplayer.
                </p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Blazing Fast
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Powered by Convex. Sub-100ms sync latency. Optimized for 500+
                  shapes at 60 FPS.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 text-center">
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-white">
                  {"<"}50ms
                </div>
                <div className="text-white/60 text-sm">Cursor sync</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-white">
                  60 FPS
                </div>
                <div className="text-white/60 text-sm">Smooth rendering</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-white">
                  ∞
                </div>
                <div className="text-white/60 text-sm">Collaborators</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
