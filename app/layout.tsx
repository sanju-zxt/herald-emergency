import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HERALD — Emergency Intelligence Platform",
  description:
    "The universal bridge between what you know and what first responders can act on. Messy inputs — a photo, a voice note, a text — become structured, verified, life-saving actions in seconds.",
  applicationName: "HERALD",
  keywords: ["emergency", "intelligence", "gemini", "disaster response", "verified actions"],
  authors: [{ name: "HERALD" }],
  openGraph: {
    title: "HERALD — Emergency Intelligence Platform",
    description: "The gap between what we know and what first responders do is measured in minutes. HERALD closes it in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06090f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}