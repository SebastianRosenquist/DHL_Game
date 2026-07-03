import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

// Press Start 2P is downloaded at build time and self-hosted by Next.js — the
// runtime container never touches an external CDN.
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thursday DHL Challenge",
  description: "Log your runs, race your team, win the prizes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body className="font-sans antialiased text-ink">{children}</body>
    </html>
  );
}
