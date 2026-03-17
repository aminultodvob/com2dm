import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "Comment2DM - Turn Comments Into Conversations",
    template: "%s | Comment2DM",
  },
  description:
    "Automatically DM people on Instagram and Facebook when they comment your chosen keywords. Capture leads, share offers, and grow engagement on autopilot.",
  keywords: [
    "instagram automation",
    "facebook dm",
    "comment to dm",
    "social media automation",
    "lead generation",
  ],
  authors: [{ name: "Comment2DM" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://comment2dm.com",
    siteName: "Comment2DM",
    title: "Comment2DM - Turn Comments Into Conversations",
    description:
      "Automatically DM people on Instagram and Facebook when they comment your chosen keywords.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Comment2DM - Turn Comments Into Conversations",
    description:
      "Automatically DM people on Instagram and Facebook when they comment your chosen keywords.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


