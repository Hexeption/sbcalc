import { execSync } from "child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const REPO_URL =
  "https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO.git";
const REPO_DIR = "./output/NotEnoughUpdates-REPO";
const ITEMS_DIR = join(REPO_DIR, "items");
const OUTPUT_FILE = "./output/merged_items.json";
const RECIPES_FILE = "./output/recipes_items.json";

// Clone repo if not already present
if (!existsSync(REPO_DIR)) {
  console.log("Cloning repository...");
  execSync(`git clone ${REPO_URL} ${REPO_DIR}`);
}

console.log("Reading item JSON files...");
const files = readdirSync(ITEMS_DIR).filter((f) => f.endsWith(".json"));
const merged: Record<string, any> = {};

for (const file of files) {
  const filePath = join(ITEMS_DIR, file);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.internalname) {
        merged[item.internalname] = item;
      }
    }
  } else if (data.internalname) {
    merged[data.internalname] = data;
  }
}

writeFileSync(OUTPUT_FILE, JSON.stringify(merged, null, 2));
console.log(
  `Merged ${files.length} files into ${OUTPUT_FILE} as an object keyed by internalname.`,
);

const filtered: Record<string, any> = {};

for (const [key, itemRaw] of Object.entries(merged)) {
  const item = itemRaw as any;
  // Check for 'recipe' object
  if (item.recipe && typeof item.recipe === "object") {
    filtered[key] = item;
    continue;
  }
  // Check for 'recipes' array with at least one crafting/forge type
  if (Array.isArray(item.recipes)) {
    const hasCraftingOrForge = item.recipes.some(
      (r: any) => r.type === "crafting" || r.type === "forge",
    );
    if (hasCraftingOrForge) {
      filtered[key] = item;
    }
  }
}

writeFileSync(RECIPES_FILE, JSON.stringify(filtered, null, 2));
console.log(`Filtered items written to ${RECIPES_FILE}`);
