export interface ChangelogItem {
  title: string;
  description?: string;
}

export interface ChangelogEntry {
  date: string; // ISO date (YYYY-MM-DD)
  title?: string; // Optional section title (e.g., "December 2025")
  items: ChangelogItem[];
}

// To add new changes, append a new entry at the top of this array.
// Keep the newest entries first for easy visibility.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-07-25",
    title: "July 2026",
    items: [
      {
        title: "Official Hypixel texture pack",
        description:
          "Hypixel's official SkyBlock resource pack is now the default for item icons and is refreshed automatically with the daily item data update.",
      },
    ],
  },
  {
    date: "2026-04-12",
    title: "April 2026",
    items: [
      {
        title: "Mode switching preserves selections",
        description:
          "Switching between Single and Multi item modes no longer clears your selections. Your chosen item and quantity stay in Single mode, and your item list stays in Multi mode, so you can swap back and forth freely.",
      },
    ],
  },
  {
    date: "2026-04-11",
    title: "April 2026",
    items: [
      {
        title: "Todo mode for crafting trees",
        description:
          "Toggle the new Todo button in the crafting tree header to show checkboxes next to every step. Check off completed steps to dim them. Checking a parent automatically checks all its sub-steps. Works in both Single and Multi item modes.",
      },
      {
        title: "Checked items excluded from materials and forge time",
        description:
          "When Todo mode is active, checked-off items are removed from the Materials Needed list, Combined Materials list, and the total forge time calculation.",
      },
    ],
  },
  {
    date: "2026-04-09",
    title: "April 2026",
    items: [
      {
        title: "Texture pack support",
        description:
          "Item icons can now use custom texture packs. Ships with FurfSky Reborn and PacksHQ. Select a pack in the sidebar under Texture Packs, or choose None to use vanilla textures.",
      },
      {
        title: "Server-side head rendering",
        description:
          "Player skull items are now rendered as 3D isometric heads on the server instead of relying on external APIs. Faster, more reliable, and no third-party requests.",
      },
      {
        title: "Item gallery demo page",
        description:
          "New /demo page showing all 8000+ Skyblock items in a searchable grid with infinite scroll.",
      },
      {
        title: "Crafting vs Raw material view toggle",
        description:
          "In Multi Item mode, the Combined Materials list now has Crafting and Raw buttons. Crafting shows the first-level ingredients you'd buy from the Bazaar (Enchanted Melon, Polished Pumpkin, etc.). Raw shows fully flattened base materials like before.",
      },
      {
        title: "Forge time card hidden when not needed",
        description:
          "The Total Forge Time summary card no longer appears when there is no forge time. The grid adjusts from three columns to two.",
      },
      {
        title: "Consolidated state management with Zustand",
        description:
          "Replaced four separate React hooks and a context provider with a single Zustand store. Removed use-recipe-state, use-multi-tree-selection, use-local-storage, and settings-context. All calculator state now lives in one place.",
      },
    ],
  },
  {
    date: "2026-02-10",
    title: "February 2026",
    items: [
      {
        title: "Full app architecture rebuild",
        description:
          "Rewrote the web app with a new data layer, centralized context providers, and proper TypeScript types throughout. Eliminated all prop drilling and removed every 'as any' cast.",
      },
      {
        title: "Fixed forge time calculations",
        description:
          "Forge time is now calculated correctly for items that appear in multiple crafting branches. Previously, shared sub-ingredients were only counted once.",
      },
      {
        title: "Removed dead code and unused features",
        description:
          "Cleaned up unused files, duplicate functions, and the never-togglable colored names setting. The analytics module was trimmed from 12 functions to 4.",
      },
      {
        title: "Decomposed main calculator component",
        description:
          "Split the monolithic calculator into focused hooks for shared recipe loading, result computation, and multi-tree selection. The main component dropped from 377 to 259 lines.",
      },
      {
        title: "Fixed theme toggle hydration mismatch",
        description:
          "The dark/light mode toggle no longer causes a hydration warning on page load.",
      },
      {
        title: "Migrated to Biome",
        description:
          "Replaced ESLint and Prettier with Biome for faster linting and formatting. The entire codebase now uses a single tool for code quality.",
      },
      {
        title: "Updated all shadcn/ui components",
        description:
          "All 11 UI components refreshed to the latest shadcn/ui release with improved styling and accessibility.",
      },
      {
        title: "Upgraded all dependencies",
        description:
          "Updated to React 19.2, Next.js 16.1, Tailwind CSS 4.1, TypeScript 5.9, Turbo 2.8, Vitest 4.0, and many more.",
      },
      {
        title: "Modernized project configuration",
        description:
          "Converted to TypeScript-based Next.js config, modernized Vitest setup, and aligned shared TypeScript configs across the monorepo.",
      },
    ],
  },
  {
    date: "2025-12-29",
    title: "December 2025",
    items: [
      {
        title: "Pet names now display in color",
        description:
          "Pet names and enchanted book titles now display in their original Minecraft colors. Level 100 is automatically displayed for all pets, so you can see exactly what you're upgrading.",
      },
      {
        title: "Reorder items with drag-and-drop",
        description:
          "Rearrange your item list by dragging and dropping items. Hover over any item name to see the full name if it's truncated.",
      },
      {
        title: "Cookie consent and privacy policy",
        description:
          "We've added a cookie consent banner and a dedicated privacy page so you know exactly how we use cookies and protect your data. Your calculator settings stay private in your browser.",
      },
      {
        title: "Cleaner code under the hood",
        description:
          "We've reorganized the calculator's internal structure to make it easier to maintain and extend. The app is now built from smaller, focused components that work together smoothly.",
      },
      {
        title: "Changelog page added",
        description:
          "There's a new Changelog page. It's powered by a simple data file, so adding entries is quick and easy.",
      },
      {
        title: "Multi-item list and combined materials",
        description:
          "Add multiple items to your list and instantly see the combined materials and total forge time.",
      },
      {
        title: "Per-item tree view in multi mode",
        description:
          "Click any item in your list to open its crafting tree, with quick expand and collapse controls.",
      },
      {
        title: "Book recipe support and search improvements",
        description:
          "Enchanted books now appear in search with readable names pulled from their lore (for example, “Crop Fever I”).",
      },
      {
        title: "Hydration and local storage fixes",
        description:
          "State now loads smoothly after opening the page—no flashing or mismatch.",
      },
    ],
  },
  {
    date: "2025-11-15",
    title: "November 2025",
    items: [
      {
        title: "Quality-of-life layout tweaks",
        description:
          "Cleaner spacing to keep content away from the footer and better readability on mobile.",
      },
    ],
  },
];

export default CHANGELOG;
