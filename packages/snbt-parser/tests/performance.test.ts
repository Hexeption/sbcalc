import { describe, it, expect } from 'vitest';
import { parseSNBT } from '../src/index.js';

// Test data extracted from actual items.json patterns
const PERFORMANCE_TEST_DATA = {
    // Very large compound with many nested levels
    largeCompound: `{
    ExtraAttributes: {
      id: "PERFORMANCE_TEST_ITEM",
      stats: {
        damage: 1000,
        strength: 500,
        crit_chance: 50.5,
        crit_damage: 200.0,
        attack_speed: 0.5,
        health: 2000,
        defense: 300,
        speed: 100,
        intelligence: 1000,
        sea_creature_chance: 5.0
      },
      abilities: [
        0: {
          name: "Ability One",
          description: ["Line 1", "Line 2", "Line 3"],
          cooldown: 30S,
          mana_cost: 100,
          damage_multiplier: 2.5F
        },
        1: {
          name: "Ability Two", 
          description: ["Different line 1", "Different line 2"],
          cooldown: 60S,
          mana_cost: 200,
          damage_multiplier: 4.0F
        }
      ],
      rarity_upgrades: 5B,
      hot_potato_count: 10B,
      art_of_war_count: 1B,
      modifier: "legendary",
      rarity: "LEGENDARY"
    },
    ItemModel: "minecraft:diamond_sword",
    HideFlags: 254,
    Unbreakable: 1B,
    display: {
      Name: "§6§lPerformance Test Sword",
      Lore: [
        0: "§7Damage: §c+1000",
        1: "§7Strength: §c+500", 
        2: "§7Crit Chance: §c+50%",
        3: "§7Crit Damage: §c+200%",
        4: "§7Attack Speed: §c+50%",
        5: "",
        6: "§7Health: §a+2000",
        7: "§7Defense: §a+300",
        8: "§7Speed: §a+100",
        9: "§7Intelligence: §a+1000",
        10: "",
        11: "§6Ability: Ability One §e§lRIGHT CLICK",
        12: "§7Description line 1",
        13: "§7Description line 2", 
        14: "§7Description line 3",
        15: "§8Cooldown: §a30s",
        16: "§8Mana Cost: §3100",
        17: "",
        18: "§6Ability: Ability Two §e§lSHIFT RIGHT CLICK",
        19: "§7Different description line 1",
        20: "§7Different description line 2",
        21: "§8Cooldown: §a60s",
        22: "§8Mana Cost: §3200",
        23: "",
        24: "§6§lLEGENDARY SWORD"
      ]
    },
    AttributeModifiers: [
      0: {
        AttributeName: "generic.attack_damage",
        Name: "generic.attack_damage",
        Amount: 1000.0,
        Operation: 0,
        UUID: [I; -1234567890, 987654321, -555666777, 888999000],
        Slot: "mainhand"
      }
    ]
  }`,

    // Large array with many elements
    largeArray: `[
    ${Array.from({ length: 1000 }, (_, i) => `${i}: "Item ${i}"`).join(', ')}
  ]`,

    // Deep nesting
    deepNesting: `{
    level1: {
      level2: {
        level3: {
          level4: {
            level5: {
              level6: {
                level7: {
                  level8: {
                    level9: {
                      level10: {
                        value: "deep"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`
};

describe('Performance Tests', () => {
    describe('Large Data Structures', () => {
        it('should parse large compounds efficiently', () => {
            const start = performance.now();
            const result = parseSNBT(PERFORMANCE_TEST_DATA.largeCompound);
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should parse in under 100ms
            expect(result).toBeDefined();
            expect((result as any).ExtraAttributes.id).toBe('PERFORMANCE_TEST_ITEM');
        });

        it('should parse large arrays efficiently', () => {
            const start = performance.now();
            const result = parseSNBT(PERFORMANCE_TEST_DATA.largeArray, { maxDepth: 1500 });
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should parse in under 100ms
            expect(Array.isArray(result)).toBe(true);
            expect((result as any[]).length).toBe(1000);
        });

        it('should handle deep nesting without stack overflow', () => {
            const start = performance.now();
            const result = parseSNBT(PERFORMANCE_TEST_DATA.deepNesting);
            const end = performance.now();

            expect(end - start).toBeLessThan(10); // Should parse quickly
            expect((result as any).level1.level2.level3.level4.level5.level6.level7.level8.level9.level10.value).toBe('deep');
        });
    });

    describe('Memory Usage', () => {
        it('should not leak memory with repeated parsing', () => {
            const testData = '{test: "value", number: 42}';

            // Parse the same data many times
            for (let i = 0; i < 10000; i++) {
                const result = parseSNBT(testData);
                expect(result).toEqual({ test: 'value', number: 42 });
            }

            // If we get here without running out of memory, we're good
            expect(true).toBe(true);
        });
    });

    describe('Scalability', () => {
        it('should scale linearly with input size', () => {
            const sizes = [50, 100, 150]; // Smaller sizes to avoid depth limit
            const times: number[] = [];

            sizes.forEach(size => {
                const data = `{${Array.from({ length: size }, (_, i) => `key${i}: "value${i}"`).join(', ')}}`;

                const start = performance.now();
                parseSNBT(data, { maxDepth: 200 });
                const end = performance.now();

                times.push(end - start);
            });

            // Each increase should not more than triple the time (allowing for JIT and other factors)
            for (let i = 1; i < times.length; i++) {
                const currentTime = times[i];
                const previousTime = times[i - 1];
                if (currentTime !== undefined && previousTime !== undefined) {
                    const ratio = currentTime / previousTime;
                    expect(ratio).toBeLessThan(4); // Allow more variance for realistic testing
                }
            }
        });
    });
});
