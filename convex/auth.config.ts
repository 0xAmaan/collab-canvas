// Convex + Clerk Authentication Configuration
// This file tells Convex how to verify Clerk JWT tokens

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
