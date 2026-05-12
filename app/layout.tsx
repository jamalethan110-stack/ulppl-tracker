import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ULPPL Tracker",
  description: "Workout, weight, and food tracking — built for the ULPPL split.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080808",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <main style={{ paddingBottom: user ? 72 : 0, minHeight: "100vh" }}>
          {children}
        </main>
        {user && <BottomNav />}
      </body>
    </html>
  );
}
