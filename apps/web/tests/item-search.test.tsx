import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ItemImage } from "@/components/item-image";
import type { RecipeEntry } from "@/lib/types";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

describe("ItemImage", () => {
  const mockEntry: RecipeEntry = {
    displayname: "Test Item",
    internalname: "TEST_ITEM",
    itemid: "minecraft:iron_ingot",
  };

  it("should render item image with correct alt text", () => {
    render(
      <ItemImage entry={mockEntry} internalname="TEST_ITEM" alt="Test Item" />,
    );

    const image = screen.getByAltText("Test Item");
    expect(image).toBeInTheDocument();
  });

  it("should use fallback for missing itemid", () => {
    const entryWithoutItemId = { ...mockEntry };
    delete entryWithoutItemId.itemid;

    render(
      <ItemImage
        entry={entryWithoutItemId}
        internalname="TEST_ITEM"
        alt="Test Item"
      />,
    );

    // Should show a fallback element when itemid is missing
    const fallback = screen.getByText("?");
    expect(fallback).toBeInTheDocument();
  });

  it("should handle entry without displayname", () => {
    const entryWithoutName = {
      internalname: "TEST_ITEM",
      itemid: "minecraft:iron_ingot",
    };

    render(
      <ItemImage
        entry={entryWithoutName}
        internalname="TEST_ITEM"
        alt="Test Item"
      />,
    );

    const image = screen.getByAltText("Test Item");
    expect(image).toBeInTheDocument();
  });
});
