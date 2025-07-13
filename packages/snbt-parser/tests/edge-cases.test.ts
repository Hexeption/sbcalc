import { describe, it, expect } from 'vitest';
import { parseSNBT } from '../src/index.js';

describe('Edge Cases and Special Formats', () => {
    describe('Whitespace Handling', () => {
        it('should handle whitespace in various places', () => {
            expect(parseSNBT('  {  name  :  "test"  }  ')).toEqual({ name: 'test' });
            expect(parseSNBT('[\n  1,\n  2,\n  3\n]')).toEqual([1, 2, 3]);
            expect(parseSNBT('{\n  "key": "value"\n}')).toEqual({ key: 'value' });
        });
    });

    describe('Mixed Value Types', () => {
        it('should handle mixed types in compounds', () => {
            const result = parseSNBT(`{
        string: "test",
        number: 42,
        float: 3.14F,
        long: 1000L,
        boolean_like: 1B,
        array: [1, 2, 3],
        nested: { inner: "value" }
      }`);

            expect(result).toEqual({
                string: 'test',
                number: 42,
                float: 3.14,
                long: 1000n,
                boolean_like: 1,
                array: [1, 2, 3],
                nested: { inner: 'value' }
            });
        });

        it('should handle mixed types in arrays', () => {
            const result = parseSNBT('[1, "string", 3.14, {key: "value"}]');
            expect(result).toEqual([1, 'string', 3.14, { key: 'value' }]);
        });
    });

    describe('Special Characters in Strings', () => {
        it('should handle Unicode characters', () => {
            expect(parseSNBT('"Hello 世界"')).toBe('Hello 世界');
            expect(parseSNBT('"Emoji: 🎮"')).toBe('Emoji: 🎮');
        });

        it('should handle Minecraft color codes', () => {
            expect(parseSNBT('"§aGreen Text"')).toBe('§aGreen Text');
            expect(parseSNBT('"§c§lRed Bold"')).toBe('§c§lRed Bold');
        });

        it('should handle special symbols', () => {
            expect(parseSNBT('"Symbol: ⚔"')).toBe('Symbol: ⚔');
            expect(parseSNBT('"Arrow: ➤"')).toBe('Arrow: ➤');
        });
    });

    describe('Large Numbers', () => {
        it('should handle large integers', () => {
            expect(parseSNBT('9007199254740991')).toBe(9007199254740991);
            expect(parseSNBT('9007199254740992L')).toBe(9007199254740992n);
        });

        it('should handle very large BigInt values', () => {
            const largeNum = '18446744073709551615L';
            expect(parseSNBT(largeNum)).toBe(18446744073709551615n);
        });
    });

    describe('Empty and Null-like Values', () => {
        it('should handle empty strings', () => {
            expect(parseSNBT('""')).toBe('');
            expect(parseSNBT("''")).toBe('');
        });

        it('should handle compounds with empty values', () => {
            expect(parseSNBT('{empty: ""}')).toEqual({ empty: '' });
            expect(parseSNBT('{zero: 0}')).toEqual({ zero: 0 });
        });
    });

    describe('Minecraft-specific Patterns', () => {
        it('should handle typical Minecraft UUIDs', () => {
            const uuid = 'd14d5e12-9e98-3a67-a701-be84468a74c0';
            const result = parseSNBT(`{Id: "${uuid}"}`);
            expect(result).toEqual({ Id: uuid });
        });

        it('should handle base64 texture data', () => {
            const base64 = 'ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNw==';
            const result = parseSNBT(`{Value: "${base64}"}`);
            expect(result).toEqual({ Value: base64 });
        });

        it('should handle typical item count patterns', () => {
            expect(parseSNBT('{Count: 1B}')).toEqual({ Count: 1 });
            expect(parseSNBT('{Count: 64B}')).toEqual({ Count: 64 });
        });

        it('should handle damage values', () => {
            expect(parseSNBT('{Damage: 0S}')).toEqual({ Damage: 0 });
            expect(parseSNBT('{Damage: 100S}')).toEqual({ Damage: 100 });
        });
    });

    describe('Complex Real-world Scenarios', () => {
        it('should handle very long lore arrays', () => {
            const longLore = Array.from({ length: 20 }, (_, i) => `${i}: "Line ${i}"`).join(', ');
            const result = parseSNBT(`{Lore: [${longLore}]}`);

            expect((result as any).Lore).toHaveLength(20);
            expect((result as any).Lore[0]).toBe('Line 0');
            expect((result as any).Lore[19]).toBe('Line 19');
        });

        it('should handle nested enchantment data', () => {
            const enchantData = `{
        StoredEnchantments: [
          0: {id: "minecraft:sharpness", lvl: 5S},
          1: {id: "minecraft:looting", lvl: 3S},
          2: {id: "minecraft:unbreaking", lvl: 3S}
        ]
      }`;

            const result = parseSNBT(enchantData) as any;
            expect(result.StoredEnchantments).toHaveLength(3);
            expect(result.StoredEnchantments[0].id).toBe('minecraft:sharpness');
            expect(result.StoredEnchantments[0].lvl).toBe(5);
        });
    });
});
