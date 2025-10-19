import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";

// ==================== Internal Components ====================
const AnimatedBackground = () => (
  <>
    <div className="absolute inset-0 bg-slate-950">
      <div className="absolute inset-0 [background:radial-gradient(40%_60%_at_50%_-20%,rgba(59,130,246,0.15),transparent),radial-gradient(30%_30%_at_80%_20%,rgba(59,130,246,0.08),transparent)]"></div>
    </div>
  </>
);

const FeatureCard = ({ icon, title, description }: any) => {
  return (
    <div className="group relative h-full">
      <div className="relative h-full bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 transition-all duration-300 hover:border-slate-700 hover:ring-1 hover:ring-sky-500/20 hover:-translate-y-1 flex flex-col">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1.5">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const StatItem = ({ value, label }: any) => (
  <div className="space-y-1.5">
    <div className="text-3xl md:text-4xl font-bold text-slate-100">{value}</div>
    <div className="text-slate-500 text-xs">{label}</div>
  </div>
);

/* ======================================
              Main Component
======================================= */
const Home = async () => {
  // Redirect authenticated users to dashboard
  const { userId } = await auth();
  userId && redirect("/dashboard");

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      <AnimatedBackground />

      {/* Floating Sign In Button - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <button className="group px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl text-white font-semibold border border-white/20 hover:border-white/30 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60">
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

      <div className="relative z-10 h-screen flex flex-col items-center justify-center p-6 py-8">
        {/* Main Content */}
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Real-time collaboration
            </div>

            {/* Main heading */}
            <div className="space-y-3">
              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white">
                Design together
                <br />
                in real time.
              </h1>
              <div className="h-1 w-24 bg-sky-500/30 mx-auto rounded-full"></div>
            </div>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Multiplayer canvas with instant sync, live cursors, and smooth
              performance.
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="px-5 py-2.5 rounded-lg bg-sky-500 text-slate-900 font-semibold hover:bg-sky-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60">
                  Start free
                </button>
              </SignInButton>
              <a
                href="#features"
                className="px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              >
                Explore features
              </a>
            </div>

            <p className="text-white/50 text-xs">
              No credit card required • Free forever
            </p>
          </div>

          {/* Features Grid */}
          <div
            id="features"
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 md:grid-rows-1"
          >
            <FeatureCard
              icon={
                <svg
                  className="w-5 h-5 text-slate-300"
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
              }
              title="Intuitive tools"
              description="Create and edit shapes fast with precision controls."
            />

            <FeatureCard
              icon={
                <svg
                  className="w-5 h-5 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
                  />
                </svg>
              }
              title="Live collaboration"
              description="See every cursor, selection, and change as it happens."
            />

            <FeatureCard
              icon={
                <svg
                  className="w-5 h-5 text-slate-300"
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
              }
              title="Blazing fast"
              description="Sub-100ms sync and 60 FPS rendering at scale."
            />
          </div>

          {/* Stats Section */}
          <div className="mt-20 text-center">
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <StatItem value={"<50ms"} label="Cursor sync" />
              <StatItem value="60 FPS" label="Rendering" />
              <StatItem value="Unlimited" label="Collaborators" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
