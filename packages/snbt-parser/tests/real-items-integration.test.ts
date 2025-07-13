import { describe, it, expect } from 'vitest';
import { parseSNBT } from '../src/index.js';

// Real SNBT data from the actual items.json file
const REAL_ITEMS_DATA = [
    // Barn skin with complex skull owner
    `{ExtraAttributes:{id:"6_ANNIVERSARY_BARN_SKIN"},HideFlags:254,ItemModel:"minecraft:player_head",SkullOwner:{Id:"3d6ae955-4f56-3a62-9bdb-159451efe028",Properties:{textures:[0:{Name:"textures",Value:"ewogICJ0aW1lc3RhbXAiIDogMTc0OTU4MzIxNDc1NywKICAicHJvZmlsZUlkIiA6ICJiNzAwZDM2YjRkYmE0NDQzOTUzNjc4NDVlNWViZTA5MSIsCiAgInByb2ZpbGVOYW1lIiA6ICJleGVjdXRvcnkiLAogICJzaWduYXR1cmVSZXF1aXJlZCIgOiB0cnVlLAogICJ0ZXh0dXJlcyIgOiB7CiAgICAiU0tJTiIgOiB7CiAgICAgICJ1cmwiIDogImh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMTg1NDg0NDk4NTM3ZjUxMGYxN2RhNjA1NThiMGNmZjUwZTY3MWE3ZDIzOWI4MTZiYWI2M2U4MjcwNjczNmVhOCIsCiAgICAgICJtZXRhZGF0YSIgOiB7CiAgICAgICAgIm1vZGVsIiA6ICJzbGltIgogICAgICB9CiAgICB9CiAgfQp9"}]},hypixelPopulated:1B},display:{Lore:[0:"§7Consume this item to unlock the §66th",1:"§6Anniversary Barn Skin §7on §aThe",2:"§aGarden§7!",3:"",4:"§eClick to consume!",5:"",6:"§6§lLEGENDARY COSMETIC"],Name:"§66th Anniversary Barn Skin"}}`,

    // Maddox Badphone with complex data
    `{ExtraAttributes:{id:"AATROX_BADPHONE"},HideFlags:254,ItemModel:"minecraft:player_head",SkullOwner:{Id:"d14d5e12-9e98-3a67-a701-be84468a74c0",Properties:{textures:[0:{Name:"textures",Value:"ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNywKICAicHJvZmlsZUlkIiA6ICI2ZTIyNjYxZmNlMTI0MGE0YWE4OTA0NDA0NTFiYjBiNSIsCiAgInByb2ZpbGVOYW1lIiA6ICJncnZleWFyZCIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS9lMDQwMTI0ZjIyYTg0Mjk2NmJlYjU1YzllNjk4ZmUzYTJjOGI3MTMxOTBjMjZlMDNkMzdmNDA3NGJkNTAzMDMxIgogICAgfQogIH0KfQ=="}]},hypixelPopulated:1B},display:{Lore:[0:"§6Ability: Wasssaaaaa?  §e§lRIGHT CLICK",1:"§7Instantly calls §5Maddox§7!",2:"",3:"§4☠ §cRequires §5Wolf Slayer 3§c.",4:"§4☠ §cRequires §5Vampire Slayer 2§c.",5:"§8§l* §8Co-op Soulbound §8§l*",6:"§9§lRARE"],Name:"§9Maddox Badphone"}}`,

    // Absolute Ender Pearl
    `{ExtraAttributes:{id:"ABSOLUTE_ENDER_PEARL"},HideFlags:254,ItemModel:"minecraft:player_head",SkullOwner:{Id:"d9cb8bfa-f9da-35ca-b22e-828adfc7fd6a",Properties:{textures:[0:{Name:"textures",Value:"ewogICJ0aW1lc3RhbXAiIDogMTY1MjE0NjQ4ODk4NiwKICAicHJvZmlsZUlkIiA6ICI0M2NmNWJkNjUyMDM0YzU5ODVjMDIwYWI3NDE0OGQxYiIsCiAgInByb2ZpbGVOYW1lIiA6ICJrYW1pbDQ0NSIsCiAgInNpZ25hdHVyZVJlcXVpcmVkIiA6IHRydWUsCiAgInRleHR1cmVzIiA6IHsKICAgICJTS0lOIiA6IHsKICAgICAgInVybCIgOiAiaHR0cDovL3RleHR1cmVzLm1pbmVjcmFmdC5uZXQvdGV4dHVyZS82N2Q5ZmUwNjUwMjRmZmY0YjM0Yzc4ZjkyY2QzMTUwZDZiZGZhYWI3YzM3NWEwZWU3ODUwNzZlMWE0YTI1NGU5IiwKICAgICAgIm1ldGFkYXRhIiA6IHsKICAgICAgICAibW9kZWwiIDogInNsaW0iCiAgICAgIH0KICAgIH0KICB9Cn0="}]},hypixelPopulated:1B},display:{Lore:[0:"§8Collection Item",1:"",2:"§9§lRARE"],Name:"§9Absolute Ender Pearl"}}`
];

describe('Real Items.json Data Integration', () => {
    it('should parse all real SNBT data from items.json', () => {
        REAL_ITEMS_DATA.forEach((snbt, index) => {
            const result = parseSNBT(snbt);

            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result).not.toBeNull();

            // Verify common structure
            const data = result as any;
            expect(data.ExtraAttributes?.id).toBeDefined();
            expect(data.ItemModel).toBeDefined();
            expect(data.HideFlags).toBeDefined();

            console.log(`✅ Successfully parsed item ${index + 1}: ${data.ExtraAttributes.id}`);
        });
    });

    it('should extract ItemModel correctly from real data', () => {
        REAL_ITEMS_DATA.forEach(snbt => {
            const result = parseSNBT(snbt) as any;
            expect(result.ItemModel).toBe('minecraft:player_head');
        });
    });

    it('should extract SkullOwner texture data correctly', () => {
        REAL_ITEMS_DATA.forEach(snbt => {
            const result = parseSNBT(snbt) as any;
            const textureValue = result.SkullOwner?.Properties?.textures?.[0]?.Value;

            expect(textureValue).toBeDefined();
            expect(typeof textureValue).toBe('string');

            // Should be valid base64
            expect(() => atob(textureValue)).not.toThrow();

            // Should decode to valid JSON
            const decoded = JSON.parse(atob(textureValue));
            expect(decoded.textures?.SKIN?.url).toBeDefined();
        });
    });

    it('should handle hypixelPopulated boolean flag', () => {
        REAL_ITEMS_DATA.forEach(snbt => {
            const result = parseSNBT(snbt) as any;
            expect(result.SkullOwner?.hypixelPopulated).toBe(1);
        });
    });

    it('should parse display lore arrays correctly', () => {
        REAL_ITEMS_DATA.forEach(snbt => {
            const result = parseSNBT(snbt) as any;
            const lore = result.display?.Lore;

            if (lore) {
                expect(Array.isArray(lore)).toBe(true);
                expect(lore.length).toBeGreaterThan(0);

                // Check that all lore entries are strings
                lore.forEach((line: any) => {
                    expect(typeof line).toBe('string');
                });
            }
        });
    });
});
