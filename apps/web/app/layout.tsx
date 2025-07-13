import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Skyblock Calculator",
    template: "%s | Skyblock Calculator",
  },
  description:
    "A comprehensive tool for calculating Minecraft Hypixel Skyblock item recipes, forge times, and base requirements. Plan your crafting efficiently with our interactive recipe tree and ingredient calculator.",
  keywords: [
    "minecraft",
    "hypixel",
    "skyblock",
    "calculator",
    "recipes",
    "items",
    "forge",
    "crafting",
    "ingredients",
    "neu",
    "not enough updates",
  ],
  authors: [{ name: "Hexeption" }],
  creator: "Hexeption",
  publisher: "Hexeption",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sbcalc.net",
    title: "Skyblock Calculator",
    description:
      "Calculate Minecraft Hypixel Skyblock item recipes, forge times, and base requirements",
    siteName: "Skyblock Calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skyblock Calculator",
    description:
      "Calculate Minecraft Hypixel Skyblock item recipes, forge times, and base requirements",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
