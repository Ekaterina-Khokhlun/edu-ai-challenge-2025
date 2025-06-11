import { describe, test, expect } from '@jest/globals';
import { CoordinateUtils, RandomUtils, ValidationUtils, ArrayUtils } from './GameUtils.js';

describe('GameUtils', () => {
  describe('CoordinateUtils', () => {
    describe('isValidCoordinate', () => {
      test('should return true for valid coordinates', () => {
        expect(CoordinateUtils.isValidCoordinate(0, 0)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(5, 5)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(9, 9)).toBe(true);
      });

      test('should return false for invalid coordinates', () => {
        expect(CoordinateUtils.isValidCoordinate(-1, 0)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(0, -1)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(10, 0)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(0, 10)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(-1, -1)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(10, 10)).toBe(false);
      });

      test('should handle edge cases', () => {
        expect(CoordinateUtils.isValidCoordinate(0, 9)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(9, 0)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(9.5, 0)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(0, 9.5)).toBe(false);
      });
    });

    describe('parseCoordinates', () => {
      test('should parse valid coordinate strings', () => {
        expect(CoordinateUtils.parseCoordinates('00')).toEqual({ row: 0, col: 0 });
        expect(CoordinateUtils.parseCoordinates('34')).toEqual({ row: 3, col: 4 });
        expect(CoordinateUtils.parseCoordinates('99')).toEqual({ row: 9, col: 9 });
      });

      test('should return null for invalid strings', () => {
        expect(CoordinateUtils.parseCoordinates('')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('0')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('000')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('ab')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('a1')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('1a')).toBeNull();
        expect(CoordinateUtils.parseCoordinates(null)).toBeNull();
        expect(CoordinateUtils.parseCoordinates(undefined)).toBeNull();
      });
    });

    describe('coordinatesToString', () => {
      test('should convert coordinates to string', () => {
        expect(CoordinateUtils.coordinatesToString(0, 0)).toBe('00');
        expect(CoordinateUtils.coordinatesToString(3, 4)).toBe('34');
        expect(CoordinateUtils.coordinatesToString(9, 9)).toBe('99');
      });
    });

    describe('getAdjacentCoordinates', () => {
      test('should get adjacent coordinates for middle position', () => {
        const adjacent = CoordinateUtils.getAdjacentCoordinates(5, 5);
        expect(adjacent).toHaveLength(4);
        expect(adjacent).toContainEqual({ row: 4, col: 5 });
        expect(adjacent).toContainEqual({ row: 6, col: 5 });
        expect(adjacent).toContainEqual({ row: 5, col: 4 });
        expect(adjacent).toContainEqual({ row: 5, col: 6 });
      });

      test('should get adjacent coordinates for corner position', () => {
        const adjacent = CoordinateUtils.getAdjacentCoordinates(0, 0);
        expect(adjacent).toHaveLength(2);
        expect(adjacent).toContainEqual({ row: 1, col: 0 });
        expect(adjacent).toContainEqual({ row: 0, col: 1 });
      });

      test('should get adjacent coordinates for edge position', () => {
        const adjacent = CoordinateUtils.getAdjacentCoordinates(0, 5);
        expect(adjacent).toHaveLength(3);
        expect(adjacent).toContainEqual({ row: 1, col: 5 });
        expect(adjacent).toContainEqual({ row: 0, col: 4 });
        expect(adjacent).toContainEqual({ row: 0, col: 6 });
      });
    });
  });

  describe('RandomUtils', () => {
    describe('randomInt', () => {
      test('should generate numbers within range', () => {
        for (let i = 0; i < 100; i++) {
          const num = RandomUtils.randomInt(0, 10);
          expect(num).toBeGreaterThanOrEqual(0);
          expect(num).toBeLessThan(10);
          expect(Number.isInteger(num)).toBe(true);
        }
      });

      test('should handle single value range', () => {
        const num = RandomUtils.randomInt(5, 6);
        expect(num).toBe(5);
      });

      test('should handle negative ranges', () => {
        for (let i = 0; i < 50; i++) {
          const num = RandomUtils.randomInt(-5, 0);
          expect(num).toBeGreaterThanOrEqual(-5);
          expect(num).toBeLessThan(0);
        }
      });
    });

    describe('randomChoice', () => {
      test('should choose from array', () => {
        const array = [1, 2, 3, 4, 5];
        for (let i = 0; i < 50; i++) {
          const choice = RandomUtils.randomChoice(array);
          expect(array).toContain(choice);
        }
      });

      test('should handle single element array', () => {
        const array = ['only'];
        const choice = RandomUtils.randomChoice(array);
        expect(choice).toBe('only');
      });

      test('should handle different data types', () => {
        const array = [1, 'string', { obj: true }, [1, 2, 3]];
        const choice = RandomUtils.randomChoice(array);
        expect(array).toContain(choice);
      });
    });

    describe('randomOrientation', () => {
      test('should return valid orientations', () => {
        const orientations = [];
        for (let i = 0; i < 100; i++) {
          orientations.push(RandomUtils.randomOrientation());
        }
        
        expect(orientations).toContain('horizontal');
        expect(orientations).toContain('vertical');
        
        orientations.forEach(orientation => {
          expect(['horizontal', 'vertical']).toContain(orientation);
        });
      });
    });
  });

  describe('ValidationUtils', () => {
    describe('validateCoordinateInput', () => {
      test('should validate correct inputs', () => {
        const result = ValidationUtils.validateCoordinateInput('34');
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });

      test('should reject invalid length inputs', () => {
        let result = ValidationUtils.validateCoordinateInput('3');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('exactly two digits');

        result = ValidationUtils.validateCoordinateInput('345');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('exactly two digits');

        result = ValidationUtils.validateCoordinateInput('');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('exactly two digits');
      });

      test('should reject non-string inputs', () => {
        let result = ValidationUtils.validateCoordinateInput(null);
        expect(result.isValid).toBe(false);

        result = ValidationUtils.validateCoordinateInput(undefined);
        expect(result.isValid).toBe(false);

        result = ValidationUtils.validateCoordinateInput(34);
        expect(result.isValid).toBe(false);
      });

      test('should reject non-digit inputs', () => {
        let result = ValidationUtils.validateCoordinateInput('ab');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('digits');

        result = ValidationUtils.validateCoordinateInput('3a');
        expect(result.isValid).toBe(false);
      });

      test('should reject out-of-bounds coordinates', () => {
        let result = ValidationUtils.validateCoordinateInput('9a'); // Invalid format
        expect(result.isValid).toBe(false);

        result = ValidationUtils.validateCoordinateInput('99'); // Valid
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('ArrayUtils', () => {
    describe('create2DArray', () => {
      test('should create array with correct dimensions', () => {
        const array = ArrayUtils.create2DArray(3, 4, 'fill');
        
        expect(array).toHaveLength(3);
        expect(array[0]).toHaveLength(4);
        expect(array[1]).toHaveLength(4);
        expect(array[2]).toHaveLength(4);
        
        // Check all elements are filled correctly
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 4; j++) {
            expect(array[i][j]).toBe('fill');
          }
        }
      });

      test('should create array with different fill values', () => {
        const numberArray = ArrayUtils.create2DArray(2, 2, 0);
        const objectArray = ArrayUtils.create2DArray(2, 2, { test: true });
        
        expect(numberArray[0][0]).toBe(0);
        expect(objectArray[0][0]).toEqual({ test: true });
      });

      test('should handle edge cases', () => {
        const singleArray = ArrayUtils.create2DArray(1, 1, 'single');
        expect(singleArray).toHaveLength(1);
        expect(singleArray[0]).toHaveLength(1);
        expect(singleArray[0][0]).toBe('single');
      });
    });

    describe('deepCopy2DArray', () => {
      test('should create deep copy of 2D array', () => {
        const original = [['a', 'b'], ['c', 'd']];
        const copy = ArrayUtils.deepCopy2DArray(original);
        
        expect(copy).not.toBe(original); // Different reference
        expect(copy).toEqual(original); // Same content
        expect(copy[0]).not.toBe(original[0]); // Inner arrays also different references
        
        // Modify copy shouldn't affect original
        copy[0][0] = 'modified';
        expect(original[0][0]).toBe('a');
      });

      test('should handle different data types', () => {
        const original = [[1, 2], [3, 4]];
        const copy = ArrayUtils.deepCopy2DArray(original);
        
        copy[0][0] = 999;
        expect(original[0][0]).toBe(1);
      });

      test('should handle empty arrays', () => {
        const original = [[], []];
        const copy = ArrayUtils.deepCopy2DArray(original);
        
        expect(copy).toEqual(original);
        expect(copy).not.toBe(original);
      });
    });
  });
}); 