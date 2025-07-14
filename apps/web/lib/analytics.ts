import { sendGTMEvent } from "@next/third-parties/google";

// Analytics event types
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Track when a user views an item
export function trackItemView(itemName: string, itemDisplayName?: string) {
  sendGTMEvent({
    event: "item_view",
    event_category: "item_interaction",
    event_label: itemName,
    item_display_name: itemDisplayName || itemName,
    timestamp: new Date().toISOString(),
  });
}

// Track when a user shares a recipe
export function trackRecipeShare(
  shareMethod: "copy_link" | "native_share",
  recipeDescription: string,
  itemCount: number,
) {
  sendGTMEvent({
    event: "recipe_share",
    event_category: "sharing",
    event_label: shareMethod,
    value: itemCount,
    recipe_description: recipeDescription,
    share_method: shareMethod,
    item_count: itemCount,
    timestamp: new Date().toISOString(),
  });
}

// Track recipe calculations
export function trackRecipeCalculation(
  itemName: string,
  multiplier: number,
  totalMaterials: number,
  forgeTime: number,
) {
  sendGTMEvent({
    event: "recipe_calculate",
    event_category: "recipe_interaction",
    event_label: itemName,
    value: multiplier,
    item_name: itemName,
    multiplier: multiplier,
    total_materials: totalMaterials,
    forge_time_minutes: Math.round(forgeTime / 60),
    timestamp: new Date().toISOString(),
  });
}

// Track search interactions
export function trackItemSearch(searchTerm: string, resultCount: number) {
  sendGTMEvent({
    event: "search",
    search_term: searchTerm,
    event_category: "search",
    result_count: resultCount,
    timestamp: new Date().toISOString(),
  });
}

// Track forge settings changes
export function trackForgeSettingsChange(
  settingName: string,
  oldValue: any,
  newValue: any,
) {
  sendGTMEvent({
    event: "settings_change",
    event_category: "settings",
    event_label: settingName,
    setting_name: settingName,
    old_value: String(oldValue),
    new_value: String(newValue),
    timestamp: new Date().toISOString(),
  });
}

// Track expansion/collapse of recipe trees
export function trackRecipeTreeInteraction(
  action: "expand" | "collapse" | "expand_all" | "collapse_all",
  itemName?: string,
) {
  sendGTMEvent({
    event: "recipe_tree_interaction",
    event_category: "recipe_interaction",
    event_label: action,
    action: action,
    item_name: itemName || "all",
    timestamp: new Date().toISOString(),
  });
}

// Track when shared recipes are loaded
export function trackSharedRecipeLoad(
  recipeDescription: string,
  itemCount: number,
  success: boolean,
) {
  sendGTMEvent({
    event: "shared_recipe_load",
    event_category: "sharing",
    event_label: success ? "success" : "error",
    value: itemCount,
    recipe_description: recipeDescription,
    item_count: itemCount,
    success: success,
    timestamp: new Date().toISOString(),
  });
}

// Track page views with additional context
export function trackPageView(path: string, hasSharedRecipe: boolean = false) {
  sendGTMEvent({
    event: "page_view",
    page_path: path,
    event_category: "navigation",
    has_shared_recipe: hasSharedRecipe,
    timestamp: new Date().toISOString(),
  });
}

// Track base requirements viewing
export function trackBaseRequirementsView(
  itemName: string,
  requirementsCount: number,
  multiplier: number,
) {
  sendGTMEvent({
    event: "base_requirements_view",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    requirements_count: requirementsCount,
    multiplier: multiplier,
    timestamp: new Date().toISOString(),
  });
}

// Track recipe summary viewing
export function trackRecipeSummaryView(
  itemName: string,
  itemDisplayName: string,
  multiplier: number,
  totalMaterials: number,
  totalForgeTime: number,
  forgeSlots: number,
  useMultipleSlots: boolean,
) {
  sendGTMEvent({
    event: "recipe_summary_view",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    item_display_name: itemDisplayName,
    multiplier: multiplier,
    total_materials: totalMaterials,
    total_forge_time: totalForgeTime,
    forge_slots: forgeSlots,
    use_multiple_slots: useMultipleSlots,
    timestamp: new Date().toISOString(),
  });
}

// Track forge setting changes (direct UI interaction)
export function trackForgeSettingChange(settingName: string, newValue: any) {
  sendGTMEvent({
    event: "forge_setting_change",
    event_category: "settings",
    event_label: settingName,
    setting_name: settingName,
    new_value: newValue,
    timestamp: new Date().toISOString(),
  });
}

// Track recipe tree item clicks
export function trackRecipeTreeItemClick(
  itemName: string,
  itemDisplayName: string,
  depth: number,
  multiplier: number,
  isForgeRecipe: boolean,
  isExpanded: boolean,
) {
  sendGTMEvent({
    event: "recipe_tree_item_click",
    event_category: "recipe_interaction",
    event_label: itemName,
    item_name: itemName,
    item_display_name: itemDisplayName,
    depth: depth,
    multiplier: multiplier,
    is_forge_recipe: isForgeRecipe,
    is_expanded: isExpanded,
    timestamp: new Date().toISOString(),
  });
}
