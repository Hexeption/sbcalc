# @workspace/snbt-parser

A lightweight, custom SNBT (Stringified NBT) parser for Minecraft data, built specifically for the SBCalc project.

## Features

- ✅ Parses SNBT format according to [Minecraft NBT specification](https://minecraft.fandom.com/wiki/NBT_format)
- ✅ Supports all NBT data types including typed arrays
- ✅ Handles indexed arrays (e.g., `[0:"value", 1:"value"]`)
- ✅ TypeScript support with full type definitions
- ✅ Error handling with detailed error messages
- ✅ Configurable parsing options
- ✅ Zero external dependencies

## Installation

This package is part of the workspace and should be installed automatically with the project.

## Usage

### Basic Parsing

```typescript
import { parseSNBT } from '@workspace/snbt-parser';

const result = parseSNBT('{ItemModel:"minecraft:diamond_sword",Count:1B}');
console.log(result.ItemModel); // "minecraft:diamond_sword"
console.log(result.Count); // 1
```

### Safe Parsing

```typescript
import { safeParseSNBT } from '@workspace/snbt-parser';

const result = safeParseSNBT('invalid snbt');
if (result === null) {
  console.log('Failed to parse SNBT');
}
```

### Validation

```typescript
import { isValidSNBT } from '@workspace/snbt-parser';

if (isValidSNBT('{ItemModel:"minecraft:stone"}')) {
  console.log('Valid SNBT format');
}
```

### Advanced Usage

```typescript
import { SNBTParser, SNBTParseError } from '@workspace/snbt-parser';

try {
  const parser = new SNBTParser(snbtString, {
    strict: true,
    maxDepth: 50
  });
  const result = parser.parse();
} catch (error) {
  if (error instanceof SNBTParseError) {
    console.error(`Parse error at position ${error.position}: ${error.message}`);
  }
}
```

## Supported NBT Types

- **Compound**: `{key:"value"}`
- **List**: `[1,2,3]` or `[0:"a", 1:"b"]`
- **String**: `"quoted"` or `unquoted`
- **Numbers**: `42`, `3.14`, `1B` (byte), `1S` (short), `1L` (long), `1.0F` (float), `1.0D` (double)
- **Byte Array**: `[B;1,2,3]`
- **Int Array**: `[I;1,2,3]`
- **Long Array**: `[L;1,2,3]`

## API Reference

### Functions

#### `parseSNBT(input: string, options?: ParseOptions): NBTValue`

Parse SNBT string into a JavaScript object. Throws `SNBTParseError` on invalid input.

#### `safeParseSNBT(input: string, options?: ParseOptions): NBTValue | null`

Safely parse SNBT string, returning `null` if parsing fails.

#### `isValidSNBT(input: string, options?: ParseOptions): boolean`

Check if a string is valid SNBT format.

### Classes

#### `SNBTParser`

The main parser class for advanced usage.

#### `SNBTParseError`

Error class thrown when parsing fails.

### Types

#### `ParseOptions`

```typescript
interface ParseOptions {
  strict?: boolean;    // Whether to throw on unknown/malformed data
  maxDepth?: number;   // Maximum depth to prevent stack overflow
}
```

#### `NBTValue`

Union type representing all possible NBT values:

```typescript
type NBTValue = 
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
```

## Examples

### Minecraft Item Data

```typescript
const itemData = parseSNBT(`{
  ExtraAttributes: {
    id: "DIAMOND_SWORD"
  },
  ItemModel: "minecraft:diamond_sword",
  Count: 1B,
  Damage: 0S
}`);

console.log(itemData.ExtraAttributes.id); // "DIAMOND_SWORD"
console.log(itemData.ItemModel); // "minecraft:diamond_sword"
```

### Player Head with Texture

```typescript
const skullData = parseSNBT(`{
  ItemModel: "minecraft:player_head",
  SkullOwner: {
    Properties: {
      textures: [0: {
        Value: "ewogICJ0aW1lc3RhbXAiIDogMTY3Njk2Njc2NDgwNywKICAicHJvZmlsZUlkIiA6ICI2ZTIyNjYxZmNlMTI0MGE0YWE4OTA0NDA0NTFiYjBiNSI="
      }]
    }
  }
}`);

// Access texture data
const textureValue = skullData.SkullOwner.Properties.textures[0].Value;
```

## License

Part of the SBCalc project.
