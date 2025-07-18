"use client";

import { useState, useMemo } from "react";
import { Input } from "@workspace/ui/components/input";
import { ItemImage } from "@/components/item-image";
import type { RecipesData } from "@/lib/types";

export interface ItemSearchProps {
  onSelect?: (itemValue: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

import recipesRaw from "@/data/recipes_items.json";
import itemsRaw from "@/data/items.json";

const recipes: RecipesData = recipesRaw as any;
const itemsData: RecipesData = itemsRaw as any;

export function ItemSearch({
  onSelect,
  searchValue,
  onSearchChange,
}: ItemSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Use controlled value if provided, otherwise use internal state
  const currentSearch = searchValue !== undefined ? searchValue : search;

  const items = useMemo(
    () =>
      Object.entries(recipes).map(([key, value]) => ({
        label:
          value.displayname?.replace(/§./g, "") || value.internalname || key,
        value: value.internalname || key,
      })),
    [],
  );

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!currentSearch) return items.slice(0, 10);
    const filtered = items.filter((item) =>
      item.label.toLowerCase().includes(currentSearch.toLowerCase()),
    );
    return filtered.slice(0, 10);
  }, [items, currentSearch]);

  const handleSelect = (itemValue: string) => {
    const selectedItem = items.find((item) => item.value === itemValue);
    const newSearchValue = selectedItem?.label || "";

    if (onSearchChange) {
      onSearchChange(newSearchValue);
    } else {
      setSearch(newSearchValue);
    }

    setIsOpen(false);
    if (onSelect) onSelect(itemValue);
  };

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setSearch(value);
    }
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        className="w-full px-6 py-4 text-lg"
        placeholder="Search for an item..."
        value={currentSearch}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />

      {isOpen && currentSearch && filteredItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border-2 border-border rounded-xl max-h-80 overflow-y-auto z-50">
          {filteredItems.map((item) => (
            <div
              key={item.value}
              className="px-4 py-3 cursor-pointer text-foreground border-b border-border last:border-b-0 hover:bg-accent transition-colors flex items-center gap-3"
              onClick={() => handleSelect(item.value)}
            >
              <ItemImage
                entry={recipes[item.value]}
                internalname={item.value}
                alt={item.label}
                width={24}
                height={24}
                itemsData={itemsData}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
