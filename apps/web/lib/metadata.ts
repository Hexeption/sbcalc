import { Metadata } from "next";
import { decodeRecipeState } from "@/lib/share-utils";
import type { ShareableRecipeState } from "@/lib/share-utils";

const formatItemName = (itemId: string): string => {
  return itemId
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getRecipeDescription = (state: ShareableRecipeState): string => {
  const recipeEntries = Object.entries(state.recipes);

  if (recipeEntries.length === 0) {
    return "Skyblock Calculator";
  }

  if (recipeEntries.length === 1) {
    const firstEntry = recipeEntries[0];
    if (firstEntry) {
      const [itemId, count] = firstEntry;
      return `${count}x ${formatItemName(itemId)}`;
    }
  }

  const totalItems = recipeEntries.reduce((sum, [, count]) => sum + count, 0);
  return `${recipeEntries.length} recipes (${totalItems} total items)`;
};

export function generateMetadata(searchParams?: { shared?: string }): Metadata {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://sbcalc.net"
      : "http://localhost:3000";

  // Default metadata
  let title = "Skyblock Calculator";
  let description =
    "A comprehensive tool for calculating Minecraft Hypixel Skyblock item recipes, forge times, and base requirements. Plan your crafting efficiently with our interactive recipe tree and ingredient calculator.";

  // OG image URL - always include the API route
  let ogImageUrl = `${baseUrl}/api/og`;

  // If there's shared data, customize the metadata
  if (searchParams?.shared) {
    const decodedState = decodeRecipeState(searchParams.shared);
    if (decodedState) {
      const recipeDesc = getRecipeDescription(decodedState);
      title = `${recipeDesc} | Skyblock Calculator`;
      description = `Shared recipe configuration: ${recipeDesc}. Calculate crafting requirements and forge times for Minecraft Hypixel Skyblock.`;

      // Add the shared parameter to the OG image URL
      ogImageUrl = `${baseUrl}/api/og?shared=${encodeURIComponent(searchParams.shared)}`;
    }
  }

  return {
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
      url: baseUrl,
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
