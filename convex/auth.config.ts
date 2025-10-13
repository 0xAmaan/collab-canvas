// Convex + Clerk Authentication Configuration
// This file tells Convex how to verify Clerk JWT tokens

export default {
  providers: [
    {
      domain: "https://fancy-husky-19.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
