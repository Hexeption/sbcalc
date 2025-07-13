import { parseSNBT, safeParseSNBT } from "@workspace/snbt-parser";

// Test with actual SNBT data from your JSON files
const testCases = [
    // Simple item model
    '{ItemModel:"minecraft:player_head"}',

    // Item with extra attributes
    '{ExtraAttributes:{id:"AATROX_BADPHONE"},HideFlags:254,ItemModel:"minecraft:player_head"}',

    // Complex item with skull owner (simplified for testing)
    '{ItemModel:"minecraft:player_head",SkullOwner:{Properties:{textures:[0:{Value:"test"}]}}}',

    // Item with display data
    '{ItemModel:"minecraft:diamond_sword",display:{Name:"Test Item"}}',
];

console.log("🧪 Testing custom SNBT parser with real data formats...\n");

testCases.forEach((testCase, index) => {
    console.log(`Test Case ${index + 1}:`);
    console.log(`Input: ${testCase}`);

    try {
        const result = parseSNBT(testCase);
        console.log("✅ Parsed successfully!");

        if (result && typeof result === 'object') {
            if ('ItemModel' in result) {
                console.log(`  ItemModel: ${result.ItemModel}`);
            }
            if ('ExtraAttributes' in result) {
                const attrs = result.ExtraAttributes;
                if (attrs?.id) {
                    console.log(`  Item ID: ${attrs.id}`);
                }
            }
        }
    } catch (error) {
        console.log("❌ Parse failed:", error.message);

        // Test safe parsing
        const safeResult = safeParseSNBT(testCase);
        if (safeResult === null) {
            console.log("🔄 Safe parse also returned null, as expected");
        }
    }

    console.log("");
});

console.log("🎉 SNBT parser test completed!");
