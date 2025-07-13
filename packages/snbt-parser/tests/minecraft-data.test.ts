import { describe, it, expect } from "vitest";
import {
  parseSNBT,
  safeParseSNBT,
  isValidSNBT,
  SNBTParseError,
} from "../src/index.js";

// Real SNBT data from the items.json file
const REAL_SNBT_EXAMPLES = {
  // Simple item model
  simpleItem: '{ItemModel:"minecraft:player_head"}',

  // Item with extra attributes and flags
  itemWithFlags:
    '{ExtraAttributes:{id:"AATROX_BADPHONE"},HideFlags:254,ItemModel:"minecraft:player_head"}',

  // Complex skull owner data (simplified from real data)
  skullOwner: `{
    ItemModel:"minecraft:player_head",
    SkullOwner:{
      Id:"d14d5e12-9e98-3a67-a701-be84468a74c0",
      Properties:{
        textures:[0:{
          Name:"textures",
          Value:"ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNw=="
        }]
      },
      hypixelPopulated:1B
    }
  }`,

  // Item with display data and lore
  itemWithDisplay: `{
    ExtraAttributes:{id:"DIAMOND_SWORD"},
    ItemModel:"minecraft:diamond_sword",
    display:{
      Name:"§bEnchanted Diamond Sword",
      Lore:[
        0:"§7Damage: §c+100",
        1:"§7Strength: §c+50",
        2:"",
        3:"§6§lLEGENDARY SWORD"
      ]
    },
    Unbreakable:1B
  }`,

  // Complex nested structure
  complexNested: `{
    ExtraAttributes:{
      id:"ADVANCED_ITEM",
      stats:{
        damage:100,
        strength:50,
        crit_chance:25.5
      },
      abilities:[
        0:{
          name:"Special Attack",
          cooldown:30S,
          damage_multiplier:2.5F
        }
      ]
    },
    ItemModel:"minecraft:diamond_sword",
    HideFlags:254,
    Unbreakable:1B
  }`,

  // Item with arrays
  itemWithArrays: `{
    ItemModel:"minecraft:bow",
    enchantments:[
      0:{id:"power",level:5S},
      1:{id:"punch",level:2S},
      2:{id:"infinity",level:1S}
    ],
    attributeModifiers:[B;1,2,3,4,5]
  }`,
};

describe("Real Minecraft SNBT Data", () => {
  describe("Simple Items", () => {
    it("should parse simple item model", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.simpleItem);
      expect(result).toEqual({
        ItemModel: "minecraft:player_head",
      });
    });

    it("should parse item with flags and extra attributes", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.itemWithFlags);
      expect(result).toEqual({
        ExtraAttributes: { id: "AATROX_BADPHONE" },
        HideFlags: 254,
        ItemModel: "minecraft:player_head",
      });
    });
  });

  describe("Complex Items", () => {
    it("should parse skull owner data", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.skullOwner) as any;

      expect(result.ItemModel).toBe("minecraft:player_head");
      expect(result.SkullOwner.Id).toBe("d14d5e12-9e98-3a67-a701-be84468a74c0");
      expect(result.SkullOwner.Properties.textures[0].Name).toBe("textures");
      expect(result.SkullOwner.Properties.textures[0].Value).toBe(
        "ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNw==",
      );
      expect(result.SkullOwner.hypixelPopulated).toBe(1);
    });

    it("should parse item with display data", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.itemWithDisplay) as any;

      expect(result.ExtraAttributes.id).toBe("DIAMOND_SWORD");
      expect(result.ItemModel).toBe("minecraft:diamond_sword");
      expect(result.display.Name).toBe("§bEnchanted Diamond Sword");
      expect(result.display.Lore[0]).toBe("§7Damage: §c+100");
      expect(result.display.Lore[3]).toBe("§6§lLEGENDARY SWORD");
      expect(result.Unbreakable).toBe(1);
    });

    it("should parse complex nested structures", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.complexNested) as any;

      expect(result.ExtraAttributes.id).toBe("ADVANCED_ITEM");
      expect(result.ExtraAttributes.stats.damage).toBe(100);
      expect(result.ExtraAttributes.stats.crit_chance).toBe(25.5);
      expect(result.ExtraAttributes.abilities[0].name).toBe("Special Attack");
      expect(result.ExtraAttributes.abilities[0].cooldown).toBe(30);
      expect(result.ExtraAttributes.abilities[0].damage_multiplier).toBe(2.5);
    });

    it("should parse items with various array types", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.itemWithArrays) as any;

      expect(result.ItemModel).toBe("minecraft:bow");
      expect(result.enchantments[0].id).toBe("power");
      expect(result.enchantments[0].level).toBe(5);
      expect(result.enchantments[2].level).toBe(1);
      expect(result.attributeModifiers).toBeInstanceOf(Int8Array);
      expect(Array.from(result.attributeModifiers)).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("Data Extraction Patterns", () => {
    it("should extract ItemModel correctly", () => {
      Object.values(REAL_SNBT_EXAMPLES).forEach((snbt) => {
        const result = parseSNBT(snbt) as any;
        if (result.ItemModel) {
          expect(typeof result.ItemModel).toBe("string");
          expect(result.ItemModel).toMatch(/^minecraft:/);
        }
      });
    });

    it("should extract ExtraAttributes.id correctly", () => {
      const itemsWithId = [
        REAL_SNBT_EXAMPLES.itemWithFlags,
        REAL_SNBT_EXAMPLES.itemWithDisplay,
        REAL_SNBT_EXAMPLES.complexNested,
      ];

      itemsWithId.forEach((snbt) => {
        const result = parseSNBT(snbt) as any;
        expect(result.ExtraAttributes?.id).toBeDefined();
        expect(typeof result.ExtraAttributes.id).toBe("string");
      });
    });

    it("should handle SkullOwner textures", () => {
      const result = parseSNBT(REAL_SNBT_EXAMPLES.skullOwner) as any;
      const texture = result.SkullOwner?.Properties?.textures?.[0];

      expect(texture).toBeDefined();
      expect(texture.Value).toBeDefined();
      expect(typeof texture.Value).toBe("string");

      // Should be valid base64
      expect(() => atob(texture.Value)).not.toThrow();
    });
  });
});
