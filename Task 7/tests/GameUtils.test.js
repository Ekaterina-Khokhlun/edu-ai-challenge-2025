import { describe, test, expect } from '@jest/globals';
import { CoordinateUtils, RandomUtils, ValidationUtils, ArrayUtils } from '../src/utils/GameUtils.js';

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
      });

      test('should reject non-digit inputs', () => {
        let result = ValidationUtils.validateCoordinateInput('ab');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('digits');
      });
    });
  });

  describe('ArrayUtils', () => {
    describe('create2DArray', () => {
      test('should create array with correct dimensions', () => {
        const array = ArrayUtils.create2DArray(3, 4, 'fill');
        
        expect(array).toHaveLength(3);
        expect(array[0]).toHaveLength(4);
        
        // Check all elements are filled correctly
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 4; j++) {
            expect(array[i][j]).toBe('fill');
          }
        }
      });
    });

    describe('deepCopy2DArray', () => {
      test('should create deep copy of 2D array', () => {
        const original = [['a', 'b'], ['c', 'd']];
        const copy = ArrayUtils.deepCopy2DArray(original);
        
        expect(copy).not.toBe(original); // Different reference
        expect(copy).toEqual(original); // Same content
        
        // Modify copy shouldn't affect original
        copy[0][0] = 'modified';
        expect(original[0][0]).toBe('a');
      });
    });
  });
}); 