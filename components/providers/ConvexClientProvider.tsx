"use client";

/**
 * Convex Client Provider with Clerk Authentication
 * Wraps the app with ConvexProvider and integrates Clerk auth
 */

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  // Wrap useAuth to specify the JWT template name
  const useAuthWithTemplate = () => {
    const auth = useAuth();
    return {
      ...auth,
      // Override getToken to use the "convex" template
      getToken: async (options?: any) => {
        return auth.getToken({ template: "convex", ...options });
      },
    };
  };

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuthWithTemplate}>
      {children}
    </ConvexProviderWithClerk>
  );
};
