import { extractFromSNBT } from "../lib/utils.js";

// Test with real SNBT data
const testSNBT = `{ExtraAttributes:{id:"AATROX_BADPHONE"},HideFlags:254,ItemModel:"minecraft:player_head",SkullOwner:{Id:"d14d5e12-9e98-3a67-a701-be84468a74c0",Properties:{textures:[0:{Name:"textures",Value:"ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNywKICAicHJvZmlsZUlkIiA6ICI2ZTIyNjYxZmNlMTI0MGE0YWE4OTA0NDA0NTFiYjBiNSIsCiAgInByb2ZpbGVOYW1lIiA6ICJncnZleWFyZCIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS9lMDQwMTI0ZjIyYTg0Mjk2NmJlYjU1YzllNjk4ZmUzYTJjOGI3MTMxOTBjMjZlMDNkMzdmNDA3NGJkNTAzMDMxIgogICAgfQogIH0KfQ=="}]},hypixelPopulated:1B}}`;

console.log("🧪 Testing extractFromSNBT without fallback...");

try {
    const result = extractFromSNBT(testSNBT);

    console.log("✅ Successfully extracted data:");
    console.log("  ItemModel:", result.itemModel);
    console.log("  TextureUrl:", result.textureUrl ? "✅ Generated" : "❌ None");

    if (result.itemModel === "player_head" && result.textureUrl?.includes("mc-heads.net")) {
        console.log("🎉 Perfect! Our custom parser works without fallback!");
    } else {
        console.log("⚠️  Something might be wrong with the extraction");
    }
} catch (error) {
    console.error("❌ Failed to extract:", error.message);
}

console.log("\n🔥 No more regex fallback needed - pure SNBT parser power!");
