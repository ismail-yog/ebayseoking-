import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SyncSell | Automate & AI-Optimize Your eBay Store",
  description: "Rank higher and maximize sales on eBay using Claude 4.6 Sonnet to automatically optimize your titles, descriptions, and keywords. Scale your eBay empire in real-time.",
  metadataBase: new URL("https://syncsell.ai"),
  openGraph: {
    title: "SyncSell | Automate & AI-Optimize Your eBay Store",
    description: "Rank higher and maximize sales on eBay using Claude 4.6 Sonnet to automatically optimize your listings.",
    url: "https://syncsell.ai",
    siteName: "SyncSell",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SyncSell | AI-Optimized eBay Listings",
    description: "Rank higher and maximize sales on eBay using Claude 4.6 Sonnet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="antialiased font-sans bg-bg-primary text-gray-100 min-h-screen selection:bg-primary/30 selection:text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
