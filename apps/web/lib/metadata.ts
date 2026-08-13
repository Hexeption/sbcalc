import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://sbcalc.net"
      : "http://localhost:3000");
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const title = "Skyblock Calculator";
  const description =
    "A comprehensive tool for calculating Minecraft Hypixel Skyblock item recipes, forge times, and base requirements. Plan your crafting efficiently with our interactive recipe tree and ingredient calculator.";
  const ogImageUrl = new URL("og.png", normalizedBaseUrl).toString();

  return {
    metadataBase: new URL(normalizedBaseUrl),
    title,
    description,
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
      url: normalizedBaseUrl,
      title,
      description,
      siteName: "Skyblock Calculator",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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
}
