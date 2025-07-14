import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { decodeRecipeState } from "@/lib/share-utils";
import { getMappingInfo } from "@/lib/item-id-mappings";
import { extractFromSNBT } from "@/lib/utils";
import itemsRaw from "@/data/items.json";
import type { ShareableRecipeState } from "@/lib/share-utils";
import type { RecipesData } from "@/lib/types";

export const runtime = "edge";

// Cast the imported data to the correct type
const itemsData = itemsRaw as RecipesData;

// Helper function to format item names for display
function formatItemName(itemId: string): string {
  // Format the ID by replacing underscores and capitalizing words
  return itemId
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getRecipeDescription(state: ShareableRecipeState): string {
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
}

function getFirstItemId(state: ShareableRecipeState): string | null {
  const recipeEntries = Object.entries(state.recipes);
  if (recipeEntries.length > 0 && recipeEntries[0]) {
    return recipeEntries[0][0];
  }
  return null;
}

function getItemImageUrl(itemId: string): string {
  // Special handling for SKYBLOCK_COIN
  if (itemId === "SKYBLOCK_COIN") {
    const mappingInfo = getMappingInfo("SKYBLOCK_COIN");
    if (mappingInfo.textureHash) {
      return `https://mc-heads.net/head/${mappingInfo.textureHash}`;
    }
  }

  // Try to get the item entry from items data
  let currentEntry = itemsData[itemId];

  if (!currentEntry) {
    // Fallback to placeholder for unknown items using site's primary color
    return `https://via.placeholder.com/80x80/a8d05f/ffffff?text=${itemId.slice(0, 2)}`;
  }

  // Player head logic
  if (currentEntry.itemid === "minecraft:skull" && currentEntry.nbttag) {
    const { textureUrl } = extractFromSNBT(currentEntry.nbttag);
    return textureUrl || "https://mc-heads.net/head/Steve";
  }

  // Use ItemModel from nbttag if present, otherwise fallback to itemid
  let modelId: string | null = null;
  if (currentEntry.nbttag) {
    const { itemModel } = extractFromSNBT(currentEntry.nbttag);
    if (itemModel) modelId = itemModel;
  }

  // Fallback to itemid
  if (!modelId && currentEntry.itemid) {
    modelId = currentEntry.itemid.replace("minecraft:", "");
  }

  if (modelId) {
    // Check if this item has a custom texture hash
    const mappingInfo = getMappingInfo(
      modelId,
      currentEntry.damage,
      currentEntry.nbttag,
    );

    if (mappingInfo.textureHash) {
      return `https://mc-heads.net/head/${mappingInfo.textureHash}`;
    } else {
      return `https://minecraftitemids.com/item/32/${mappingInfo.mappedId}.png`;
    }
  }

  // Final fallback using site's primary color
  return `https://via.placeholder.com/80x80/a8d05f/ffffff?text=${itemId.slice(0, 2)}`;
}

function getForgeSettings(state: ShareableRecipeState): string {
  const { forgeSlots, useMultipleSlots, quickForgeLevel } = state.forgeSettings;
  const parts = [];

  if (forgeSlots !== 5) {
    parts.push(`${forgeSlots} slots`);
  }

  if (!useMultipleSlots) {
    parts.push("single slot");
  }

  if (quickForgeLevel && quickForgeLevel > 0) {
    parts.push(`QF ${quickForgeLevel}`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Default settings";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shared = searchParams.get("shared");

    let title = "Skyblock Calculator";
    let subtitle =
      "Calculate crafting recipes, forge times, and base requirements";
    let description = "";
    let itemId: string | null = null;

    if (shared) {
      const decodedState = decodeRecipeState(shared);
      if (decodedState) {
        title = getRecipeDescription(decodedState);
        subtitle = "Shared Recipe Configuration";
        description = getForgeSettings(decodedState);
        itemId = getFirstItemId(decodedState);
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000", // black background
            backgroundImage:
              "radial-gradient(circle at 25px 25px, #1a1a1a 2px, transparent 0), radial-gradient(circle at 75px 75px, #1a1a1a 2px, transparent 0)",
            backgroundSize: "100px 100px",
            color: "white",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(168, 208, 95, 0.1) 0%, rgba(223, 142, 89, 0.1) 100%)", // primary and accent colors
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              maxWidth: "900px",
              padding: "80px 60px",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #a8d05f 0%, #df8e59 100%)", // primary to accent gradient
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "40px",
              }}
            >
              {itemId ? (
                <img
                  src={getItemImageUrl(itemId)}
                  alt={formatItemName(itemId)}
                  width="80"
                  height="80"
                  style={{
                    borderRadius: "8px",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: "60px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  🔨
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: shared ? "48px" : "56px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #a8d05f 0%, #df8e59 100%)", // primary to accent gradient
                backgroundClip: "text",
                color: "transparent",
                marginBottom: "20px",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: "32px",
                color: "#94a3b8",
                marginBottom: description ? "20px" : "0",
                lineHeight: 1.3,
              }}
            >
              {subtitle}
            </div>

            {description && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#64748b",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {description}
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "20px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <div>sbcalc.net</div>
            <div style={{ color: "#a8d05f" }}>•</div>
            <div>by hexeption</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000", // black background
            color: "white",
            fontSize: "40px",
            fontWeight: "bold",
          }}
        >
          <div>Skyblock Calculator</div>
          <div
            style={{ fontSize: "24px", marginTop: "20px", color: "#b3b3b3" }}
          >
            Recipe & Forge Calculator
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
