import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Running Challenge",
  description: "Log your runs, race your team, win the prizes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-ink">{children}</body>
    </html>
  );
}
