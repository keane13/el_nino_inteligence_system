import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Niño Crisis Intelligence",
  description: "Real-time El Niño 2026 multi-hazard monitoring: drought, fire, air quality, flood, and smart city analytics for Indonesia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-[var(--bg)] text-white overflow-hidden flex h-screen" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }} suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </body>
    </html>
  );
}
