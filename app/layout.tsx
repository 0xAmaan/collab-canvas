import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collab Canvas",
  description: "Collaborative canvas application with real-time features",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.className}`}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
};

export default RootLayout;
