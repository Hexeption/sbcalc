"use client";

import { useState, useMemo } from "react";

export interface ItemSearchProps {
  onSelect?: (itemValue: string) => void;
}

import recipes from "@/data/recipes_items.json";

export function ItemSearch({ onSelect }: ItemSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
    if (!search) return items.slice(0, 10);
    const filtered = items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase()),
    );
    return filtered.slice(0, 10);
  }, [items, search]);

  const handleSelect = (itemValue: string) => {
    const selectedItem = items.find((item) => item.value === itemValue);
    setSearch(selectedItem?.label || "");
    setIsOpen(false);
    if (onSelect) onSelect(itemValue);
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full px-6 py-4 bg-input border-2 border-border rounded-xl text-foreground text-lg placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
        placeholder="Search for an item..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />

      {isOpen && search && filteredItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border-2 border-border rounded-xl max-h-80 overflow-y-auto z-50">
          {filteredItems.map((item) => (
            <div
              key={item.value}
              className="px-4 py-3 cursor-pointer text-foreground border-b border-border last:border-b-0 hover:bg-accent transition-colors"
              onClick={() => handleSelect(item.value)}
            >
              {item.label}
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
