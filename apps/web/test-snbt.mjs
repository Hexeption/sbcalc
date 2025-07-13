import { parse as parseSNBT } from "@mc-wiki/snbt";

// Test function that mimics the extractFromSNBT logic
function testExtractFromSNBT(nbttag) {
    try {
        const parsed = parseSNBT(nbttag);

        // Extract ItemModel
        let itemModel = null;
        if (parsed && typeof parsed === 'object' && 'ItemModel' in parsed) {
            const model = parsed.ItemModel;
            if (typeof model === 'string') {
                itemModel = model.replace("minecraft:", "");
            }
        }

        console.log("✅ SNBT parsing successful");
        console.log("ItemModel:", itemModel);
        return { itemModel, success: true };
    } catch (error) {
        console.log("❌ SNBT parsing failed, would fall back to regex");
        console.log("Error:", error.message);

        // Fallback regex test
        const itemModelMatch = nbttag.match(/ItemModel:"([^"]+)"/i);
        const itemModel = itemModelMatch ? itemModelMatch[1].replace("minecraft:", "") : null;
        console.log("Regex fallback ItemModel:", itemModel);
        return { itemModel, success: false };
    }
}

// Test cases
const testCases = [
    '{ItemModel:"minecraft:player_head"}',
    '{ExtraAttributes:{id:"TEST"},ItemModel:"minecraft:player_head"}',
    '{ExtraAttributes:{id:"AATROX_BADPHONE"},HideFlags:254,ItemModel:"minecraft:player_head"}'
];

testCases.forEach((testCase, index) => {
    console.log(`\n=== Test Case ${index + 1} ===`);
    console.log("Input:", testCase);
    testExtractFromSNBT(testCase);
});
