import { describe, it, expect } from 'vitest';
import { parseSNBT, safeParseSNBT, isValidSNBT, SNBTParseError, SNBTParser } from '../src/index.js';

describe('Error Handling', () => {
    describe('Parse Errors', () => {
        it('should throw SNBTParseError for invalid input', () => {
            expect(() => parseSNBT('{')).toThrow(SNBTParseError);
            expect(() => parseSNBT('{ incomplete')).toThrow(SNBTParseError);
            expect(() => parseSNBT('[1,2,')).toThrow(SNBTParseError);
            expect(() => parseSNBT('invalid syntax here')).toThrow(SNBTParseError); // Multiple tokens
        });

        it('should provide detailed error information', () => {
            try {
                parseSNBT('{invalid:}');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(SNBTParseError);
                expect((error as SNBTParseError).position).toBeGreaterThan(0);
                expect((error as SNBTParseError).message).toContain('position');
            }
        });

        it('should handle unterminated strings', () => {
            expect(() => parseSNBT('"unterminated')).toThrow(SNBTParseError);
            expect(() => parseSNBT("'also unterminated")).toThrow(SNBTParseError);
        });

        it('should handle malformed compounds', () => {
            expect(() => parseSNBT('{key}')).toThrow(SNBTParseError);
            expect(() => parseSNBT('{key:value,}')).toThrow();
            expect(() => parseSNBT('{key:value key2:value2}')).toThrow(SNBTParseError);
        });

        it('should handle malformed arrays', () => {
            expect(() => parseSNBT('[1,2,]')).toThrow();
            expect(() => parseSNBT('[B;invalid]')).toThrow();
            expect(() => parseSNBT('[X;1,2,3]')).toThrow(SNBTParseError);
        });
    });

    describe('Safe Parsing', () => {
        it('should return null for invalid input', () => {
            expect(safeParseSNBT('{')).toBeNull();
            expect(safeParseSNBT('{ incomplete')).toBeNull();
            expect(safeParseSNBT('[1,2,')).toBeNull();
            expect(safeParseSNBT('invalid syntax here')).toBeNull(); // Multiple tokens
        });

        it('should return parsed result for valid input', () => {
            expect(safeParseSNBT('{valid:"input"}')).toEqual({ valid: 'input' });
            expect(safeParseSNBT('[1,2,3]')).toEqual([1, 2, 3]);
        });
    });

    describe('Validation', () => {
        it('should validate SNBT strings correctly', () => {
            expect(isValidSNBT('{valid:"input"}')).toBe(true);
            expect(isValidSNBT('[1,2,3]')).toBe(true);
            expect(isValidSNBT('"simple string"')).toBe(true);
            expect(isValidSNBT('minecraft')).toBe(true); // Valid unquoted identifier
            expect(isValidSNBT('test_item')).toBe(true); // Valid unquoted identifier
            expect(isValidSNBT('invalid')).toBe(true); // Actually valid as unquoted string

            expect(isValidSNBT('{')).toBe(false);
            expect(isValidSNBT('{ incomplete')).toBe(false);
            expect(isValidSNBT('[1,2,')).toBe(false);
            expect(isValidSNBT('invalid syntax here')).toBe(false); // Multiple tokens
        });
    });

    describe('Parser Options', () => {
        it('should respect maxDepth option', () => {
            const deepNested = '{a:{b:{c:{d:{e:{f:{g:{h:{i:{j:"deep"}}}}}}}}}}';

            expect(() => new SNBTParser(deepNested, { maxDepth: 5 }).parse()).toThrow(SNBTParseError);
            expect(() => new SNBTParser(deepNested, { maxDepth: 15 }).parse()).not.toThrow();
        });

        it('should handle strict mode', () => {
            // Test with both strict modes
            const parser1 = new SNBTParser('{valid:"input"}', { strict: true });
            const parser2 = new SNBTParser('{valid:"input"}', { strict: false });

            expect(parser1.parse()).toEqual({ valid: 'input' });
            expect(parser2.parse()).toEqual({ valid: 'input' });
        });
    });
});
