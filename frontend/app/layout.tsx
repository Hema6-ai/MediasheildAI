import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediaShield AI",
  description: "AI-Powered Sports Media Protection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
