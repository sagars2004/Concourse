import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Concourse — Your AI Airport Food Concierge",
  description:
    "Never miss your flight chasing food again. Concourse gives you time-aware, gate-smart food recommendations powered by AI.",
  openGraph: {
    title: "Concourse — Your AI Airport Food Concierge",
    description:
      "Never miss your flight chasing food again. Time-aware, gate-smart airport food recommendations powered by AI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Concourse — Your AI Airport Food Concierge",
    description:
      "Never miss your flight chasing food again. Time-aware, gate-smart airport food recommendations powered by AI.",
  },
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
