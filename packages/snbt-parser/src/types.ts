/**
 * NBT Tag Types based on Minecraft NBT format specification
 * @see https://minecraft.fandom.com/wiki/NBT_format
 */
export enum NBTTagType {
    END = 0,
    BYTE = 1,
    SHORT = 2,
    INT = 3,
    LONG = 4,
    FLOAT = 5,
    DOUBLE = 6,
    BYTE_ARRAY = 7,
    STRING = 8,
    LIST = 9,
    COMPOUND = 10,
    INT_ARRAY = 11,
    LONG_ARRAY = 12
}

export type NBTValue =
    | null
    | boolean
    | number
    | bigint
    | string
    | NBTValue[]
    | { [key: string]: NBTValue }
    | Int8Array
    | Int32Array
    | BigInt64Array;

export interface ParseOptions {
    /**
     * Whether to throw on unknown/malformed data or continue parsing
     */
    strict?: boolean;
    /**
     * Maximum depth to prevent stack overflow
     */
    maxDepth?: number;
}

export class SNBTParseError extends Error {
    constructor(message: string, public position: number) {
        super(`SNBT Parse Error at position ${position}: ${message}`);
        this.name = 'SNBTParseError';
    }
}
