export { SNBTParser } from './parser.js';
export { SNBTParseError, NBTTagType, type NBTValue, type ParseOptions } from './types.js';

import { SNBTParser } from './parser.js';
import { SNBTParseError, type NBTValue, type ParseOptions } from './types.js';

/**
 * Parse SNBT (Stringified NBT) string into a JavaScript object
 * 
 * @param input - The SNBT string to parse
 * @param options - Parsing options
 * @returns Parsed NBT data
 * 
 * @example
 * ```typescript
 * import { parseSNBT } from '@workspace/snbt-parser';
 * 
 * const result = parseSNBT('{ItemModel:"minecraft:diamond_sword",Count:1B}');
 * console.log(result.ItemModel); // "minecraft:diamond_sword"
 * console.log(result.Count); // 1
 * ```
 */
export function parseSNBT(input: string, options?: ParseOptions): NBTValue {
    const parser = new SNBTParser(input, options);
    return parser.parse();
}

/**
 * Safely parse SNBT string, returning null if parsing fails
 * 
 * @param input - The SNBT string to parse
 * @param options - Parsing options
 * @returns Parsed NBT data or null if parsing failed
 */
export function safeParseSNBT(input: string, options?: ParseOptions): NBTValue | null {
    try {
        return parseSNBT(input, options);
    } catch (error) {
        if (error instanceof SNBTParseError) {
            return null;
        }
        throw error;
    }
}

/**
 * Check if a string is valid SNBT format
 * 
 * @param input - The string to validate
 * @param options - Parsing options
 * @returns True if the string is valid SNBT
 */
export function isValidSNBT(input: string, options?: ParseOptions): boolean {
    return safeParseSNBT(input, options) !== null;
}
