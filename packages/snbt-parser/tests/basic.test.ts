import { describe, it, expect } from 'vitest';
import { parseSNBT, safeParseSNBT, isValidSNBT, SNBTParseError, SNBTParser } from '../src/index.js';

describe('Basic SNBT Parsing', () => {
    describe('Simple Values', () => {
        it('should parse strings', () => {
            expect(parseSNBT('"hello"')).toBe('hello');
            expect(parseSNBT("'world'")).toBe('world');
            expect(parseSNBT('unquoted')).toBe('unquoted');
        });

        it('should parse numbers', () => {
            expect(parseSNBT('42')).toBe(42);
            expect(parseSNBT('-17')).toBe(-17);
            expect(parseSNBT('3.14')).toBe(3.14);
            expect(parseSNBT('-2.5')).toBe(-2.5);
        });

        it('should parse numbers with suffixes', () => {
            expect(parseSNBT('1B')).toBe(1);
            expect(parseSNBT('32S')).toBe(32);
            expect(parseSNBT('1000L')).toBe(1000n);
            expect(parseSNBT('3.14F')).toBe(3.14);
            expect(parseSNBT('2.718D')).toBe(2.718);
        });
    });

    describe('Compounds', () => {
        it('should parse empty compounds', () => {
            expect(parseSNBT('{}')).toEqual({});
        });

        it('should parse simple compounds', () => {
            const result = parseSNBT('{name:"test",value:42}');
            expect(result).toEqual({ name: 'test', value: 42 });
        });

        it('should parse nested compounds', () => {
            const result = parseSNBT('{outer:{inner:"value"}}');
            expect(result).toEqual({ outer: { inner: 'value' } });
        });

        it('should handle quoted keys', () => {
            const result = parseSNBT('{"quoted key":"value"}');
            expect(result).toEqual({ 'quoted key': 'value' });
        });
    });

    describe('Lists and Arrays', () => {
        it('should parse empty lists', () => {
            expect(parseSNBT('[]')).toEqual([]);
        });

        it('should parse simple lists', () => {
            expect(parseSNBT('[1,2,3]')).toEqual([1, 2, 3]);
            expect(parseSNBT('["a","b","c"]')).toEqual(['a', 'b', 'c']);
        });

        it('should parse indexed lists', () => {
            const result = parseSNBT('[0:"first",1:"second",2:"third"]');
            expect(result).toEqual(['first', 'second', 'third']);
        });

        it('should parse typed arrays', () => {
            const byteArray = parseSNBT('[B;1,2,3]');
            expect(byteArray).toBeInstanceOf(Int8Array);
            expect(Array.from(byteArray as Int8Array)).toEqual([1, 2, 3]);

            const intArray = parseSNBT('[I;100,200,300]');
            expect(intArray).toBeInstanceOf(Int32Array);
            expect(Array.from(intArray as Int32Array)).toEqual([100, 200, 300]);

            const longArray = parseSNBT('[L;1000,2000,3000]');
            expect(longArray).toBeInstanceOf(BigInt64Array);
            expect(Array.from(longArray as BigInt64Array)).toEqual([1000n, 2000n, 3000n]);
        });
    });

    describe('String Escaping', () => {
        it('should handle escaped characters', () => {
            expect(parseSNBT('"hello\\nworld"')).toBe('hello\nworld');
            expect(parseSNBT('"tab\\there"')).toBe('tab\there');
            expect(parseSNBT('"quote\\""')).toBe('quote"');
            expect(parseSNBT("'apostrophe\\''")).toBe("apostrophe'");
            expect(parseSNBT('"backslash\\\\"')).toBe('backslash\\');
        });
    });
});
