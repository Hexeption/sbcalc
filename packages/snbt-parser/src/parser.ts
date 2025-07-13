import { NBTValue, ParseOptions, SNBTParseError } from "./types.js";

export { SNBTParseError } from "./types.js";

/**
 * A lightweight SNBT (Stringified NBT) parser for Minecraft data
 * Based on the NBT format specification: https://minecraft.fandom.com/wiki/NBT_format
 */
export class SNBTParser {
  private input: string;
  private position: number;
  private depth: number;
  private options: Required<ParseOptions>;

  constructor(input: string, options: ParseOptions = {}) {
    this.input = input;
    this.position = 0;
    this.depth = 0;
    this.options = {
      strict: options.strict ?? false,
      maxDepth: options.maxDepth ?? 100,
    };
  }

  parse(): NBTValue {
    this.skipWhitespace();
    const result = this.parseValue();
    this.skipWhitespace();

    // Ensure we've consumed the entire input
    if (this.position < this.input.length) {
      throw new SNBTParseError(
        `Unexpected character '${this.peek()}'`,
        this.position,
      );
    }

    return result;
  }

  private parseValue(): NBTValue {
    this.checkDepth();
    this.skipWhitespace();

    const char = this.peek();

    if (char === "{") {
      const result = this.parseCompound();
      this.depth--;
      return result;
    } else if (char === "[") {
      const result = this.parseArray();
      this.depth--;
      return result;
    } else if (char === '"' || char === "'") {
      return this.parseQuotedString();
    } else if (this.isDigit(char) || char === "-" || char === "+") {
      return this.parseNumber();
    } else if (this.isAlpha(char)) {
      return this.parseUnquotedString();
    }

    throw new SNBTParseError(`Unexpected character '${char}'`, this.position);
  }

  private parseCompound(): { [key: string]: NBTValue } {
    this.consume("{");
    this.skipWhitespace();

    const compound: { [key: string]: NBTValue } = {};

    if (this.peek() === "}") {
      this.consume("}");
      return compound;
    }

    while (true) {
      this.skipWhitespace();

      // Parse key
      const key = this.parseKey();
      this.skipWhitespace();
      this.consume(":");
      this.skipWhitespace();

      // Parse value
      const value = this.parseValue();
      compound[key] = value;

      this.skipWhitespace();

      if (this.peek() === "}") {
        this.consume("}");
        break;
      } else if (this.peek() === ",") {
        this.consume(",");
      } else {
        throw new SNBTParseError(
          `Expected ',' or '}' in compound`,
          this.position,
        );
      }
    }

    return compound;
  }

  private parseArray(): NBTValue[] | Int8Array | Int32Array | BigInt64Array {
    this.consume("[");
    this.skipWhitespace();

    // Check for typed arrays
    if (this.peek() === "B" || this.peek() === "I" || this.peek() === "L") {
      const typeChar = this.advance();
      this.consume(";");

      const values: (number | bigint)[] = [];
      this.skipWhitespace();

      if (this.peek() === "]") {
        this.consume("]");
        return this.createTypedArray(typeChar, values);
      }

      while (true) {
        this.skipWhitespace();
        const value = this.parseNumber();
        values.push(value);

        this.skipWhitespace();

        if (this.peek() === "]") {
          this.consume("]");
          break;
        } else if (this.peek() === ",") {
          this.consume(",");
        } else {
          throw new SNBTParseError(
            `Expected ',' or ']' in typed array`,
            this.position,
          );
        }
      }

      return this.createTypedArray(typeChar, values);
    }

    // Regular list
    const list: NBTValue[] = [];

    if (this.peek() === "]") {
      this.consume("]");
      return list;
    }

    while (true) {
      this.skipWhitespace();

      // Handle numeric indices (e.g., [0:"value", 1:"value"])
      let index = list.length;
      if (this.isDigit(this.peek())) {
        const numStr = this.parseUnquotedString();
        if (this.peek() === ":") {
          index = parseInt(numStr, 10);
          this.consume(":");
          this.skipWhitespace();
        } else {
          // It was actually a number value, not an index
          list.push(this.parseNumberFromString(numStr));
          this.skipWhitespace();

          if (this.peek() === "]") {
            this.consume("]");
            break;
          } else if (this.peek() === ",") {
            this.consume(",");
            continue;
          } else {
            throw new SNBTParseError(
              `Expected ',' or ']' in list`,
              this.position,
            );
          }
        }
      }

      const value = this.parseValue();
      list[index] = value;

      this.skipWhitespace();

      if (this.peek() === "]") {
        this.consume("]");
        break;
      } else if (this.peek() === ",") {
        this.consume(",");
      } else {
        throw new SNBTParseError(`Expected ',' or ']' in list`, this.position);
      }
    }

    return list;
  }

  private parseKey(): string {
    this.skipWhitespace();

    if (this.peek() === '"' || this.peek() === "'") {
      return this.parseQuotedString();
    } else {
      return this.parseUnquotedString();
    }
  }

  private parseQuotedString(): string {
    const quote = this.advance(); // ' or "
    let result = "";

    while (this.position < this.input.length && this.peek() !== quote) {
      if (this.peek() === "\\") {
        this.advance(); // Skip backslash
        const escaped = this.advance();
        switch (escaped) {
          case "n":
            result += "\n";
            break;
          case "t":
            result += "\t";
            break;
          case "r":
            result += "\r";
            break;
          case "\\":
            result += "\\";
            break;
          case '"':
            result += '"';
            break;
          case "'":
            result += "'";
            break;
          default:
            result += escaped;
            break;
        }
      } else {
        result += this.advance();
      }
    }

    if (this.peek() !== quote) {
      throw new SNBTParseError(`Unterminated string`, this.position);
    }

    this.advance(); // Consume closing quote
    return result;
  }

  private parseUnquotedString(): string {
    let result = "";

    while (this.position < this.input.length) {
      const char = this.peek();
      if (this.isValidUnquotedChar(char)) {
        result += this.advance();
      } else {
        break;
      }
    }

    // Validate that it's a proper unquoted string
    if (!this.isValidUnquotedString(result)) {
      throw new SNBTParseError(
        `Invalid unquoted string: ${result}`,
        this.position - result.length,
      );
    }

    return result;
  }

  private parseNumber(): number | bigint {
    const start = this.position;
    let hasDecimal = false;
    let suffix = "";

    // Handle sign
    if (this.peek() === "-" || this.peek() === "+") {
      this.advance();
    }

    // Parse digits
    while (this.position < this.input.length && this.isDigit(this.peek())) {
      this.advance();
    }

    // Handle decimal
    if (this.peek() === ".") {
      hasDecimal = true;
      this.advance();
      while (this.position < this.input.length && this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Handle suffix (B, S, L, F, D)
    if (this.position < this.input.length && /[BSLFDbslfd]/.test(this.peek())) {
      suffix = this.advance().toLowerCase();
    }

    const numStr = this.input.slice(start, this.position - (suffix ? 1 : 0));
    return this.parseNumberFromString(numStr, suffix);
  }

  private parseNumberFromString(
    numStr: string,
    suffix?: string,
  ): number | bigint {
    if (suffix === "l") {
      return BigInt(numStr);
    }

    const num = parseFloat(numStr);

    if (isNaN(num)) {
      throw new SNBTParseError(`Invalid number: ${numStr}`, this.position);
    }

    return num;
  }

  private createTypedArray(
    type: string,
    values: (number | bigint)[],
  ): Int8Array | Int32Array | BigInt64Array {
    switch (type.toLowerCase()) {
      case "b":
        return new Int8Array(values.map((v) => Number(v)));
      case "i":
        return new Int32Array(values.map((v) => Number(v)));
      case "l":
        return new BigInt64Array(
          values.map((v) => (typeof v === "bigint" ? v : BigInt(v))),
        );
      default:
        throw new SNBTParseError(`Unknown array type: ${type}`, this.position);
    }
  }

  private checkDepth(): void {
    this.depth++;
    if (this.depth > this.options.maxDepth) {
      throw new SNBTParseError(
        `Maximum depth exceeded: ${this.options.maxDepth}`,
        this.position,
      );
    }
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  private peek(): string {
    return this.input[this.position] || "";
  }

  private advance(): string {
    return this.input[this.position++] || "";
  }

  private consume(expected: string): void {
    if (this.peek() !== expected) {
      throw new SNBTParseError(
        `Expected '${expected}', got '${this.peek()}'`,
        this.position,
      );
    }
    this.advance();
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isValidUnquotedChar(char: string): boolean {
    // Only allow valid unquoted characters that make sense in SNBT context
    return /[a-zA-Z0-9_\-+.]/.test(char) && char !== "";
  }

  private isValidUnquotedString(str: string): boolean {
    // Unquoted strings should look like valid identifiers, not arbitrary text
    return /^[a-zA-Z_][a-zA-Z0-9_\-+.]*$/.test(str) || /^[0-9]/.test(str);
  }
}
