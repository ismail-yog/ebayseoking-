import type { Metadata } from "next";
import { Inter, Outfit, Montserrat } from "next/font/google";
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

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
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
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${montserrat.variable}`}>
      <body className="antialiased font-sans bg-bg-primary text-slate-800 min-h-screen selection:bg-primary/20 selection:text-primary relative overflow-x-hidden">
        {/* Subtle ambient gradient blobs (reduced intensity for light theme) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blob-indigo filter blur-[140px] pointer-events-none -z-10 opacity-60" />
        <div className="absolute top-[30%] right-[-15%] w-[40vw] h-[40vw] rounded-full bg-blob-purple filter blur-[120px] pointer-events-none -z-10 opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blob-cyan filter blur-[130px] pointer-events-none -z-10 opacity-50" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
