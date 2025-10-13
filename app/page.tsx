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
    <div className="min-h-screen bg-gradient-to-br from-canvas-blue via-canvas-purple to-canvas-red flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center text-white space-y-8">
          <h1 className="text-6xl font-bold tracking-tight">Collab Canvas</h1>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto">
            Real-time collaborative canvas where you can create, share, and
            build together
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Create Shapes</h3>
              <p className="text-white/80">
                Draw rectangles and design your canvas with simple tools
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-xl font-semibold mb-2">Collaborate Live</h3>
              <p className="text-white/80">
                See everyone's cursors and changes in real-time
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-white/80">
                Powered by Convex for instant synchronization
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-12">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button className="bg-white text-canvas-purple px-8 py-4 rounded-full text-xl font-semibold hover:bg-white/90 transition-all transform hover:scale-105 shadow-2xl">
                Get Started →
              </button>
            </SignInButton>
          </div>

          {/* Subtext */}
          <p className="text-white/70 text-sm mt-6">
            No credit card required • Free to use
          </p>
        </div>
      </div>
    </div>
  );
}
