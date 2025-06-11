import { describe, test, expect, beforeEach } from '@jest/globals';
import { Ship } from './Ship.js';

describe('Ship', () => {
  let ship;

  beforeEach(() => {
    ship = new Ship(3);
  });

  describe('Constructor', () => {
    test('should create ship with correct length', () => {
      expect(ship.getLength()).toBe(3);
      expect(ship.getPositions()).toHaveLength(0);
      expect(ship.getHitCount()).toBe(0);
      expect(ship.isSunk()).toBe(false);
    });

    test('should create ship with default length', () => {
      const defaultShip = new Ship();
      expect(defaultShip.getLength()).toBe(3); // GAME_CONFIG.SHIP_LENGTH
    });

    test('should throw error for invalid length', () => {
      expect(() => new Ship(0)).toThrow('Ship length must be a positive integer');
      expect(() => new Ship(-1)).toThrow('Ship length must be a positive integer');
      expect(() => new Ship(1.5)).toThrow('Ship length must be a positive integer');
      expect(() => new Ship('3')).toThrow('Ship length must be a positive integer');
    });
  });

  describe('Position Management', () => {
    test('should add valid positions', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.addPosition(0, 2);

      expect(ship.getPositions()).toHaveLength(3);
      expect(ship.isFullyPositioned()).toBe(true);
    });

    test('should check if ship has specific position', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);

      expect(ship.hasPosition(0, 0)).toBe(true);
      expect(ship.hasPosition(0, 1)).toBe(true);
      expect(ship.hasPosition(0, 2)).toBe(false);
    });

    test('should throw error when adding position to full ship', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.addPosition(0, 2);

      expect(() => ship.addPosition(0, 3)).toThrow('Ship is already fully positioned');
    });

    test('should throw error for invalid coordinates', () => {
      expect(() => ship.addPosition(-1, 0)).toThrow('Invalid coordinates provided');
      expect(() => ship.addPosition(0, -1)).toThrow('Invalid coordinates provided');
      expect(() => ship.addPosition(10, 0)).toThrow('Invalid coordinates provided');
      expect(() => ship.addPosition(0, 10)).toThrow('Invalid coordinates provided');
    });

    test('should throw error for duplicate positions', () => {
      ship.addPosition(0, 0);
      expect(() => ship.addPosition(0, 0)).toThrow('Position already exists on this ship');
    });
  });

  describe('Hit Management', () => {
    beforeEach(() => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.addPosition(0, 2);
    });

    test('should register hits correctly', () => {
      const result = ship.receiveHit(0, 0);
      
      expect(result).toBe(true);
      expect(ship.getHitCount()).toBe(1);
      expect(ship.isPositionHit(0, 0)).toBe(true);
      expect(ship.isPositionHit(0, 1)).toBe(false);
      expect(ship.isSunk()).toBe(false);
    });

    test('should not register hit on non-ship position', () => {
      const result = ship.receiveHit(1, 0);
      
      expect(result).toBe(false);
      expect(ship.getHitCount()).toBe(0);
      expect(ship.isPositionHit(1, 0)).toBe(false);
    });

    test('should not register duplicate hits', () => {
      ship.receiveHit(0, 0);
      const secondHit = ship.receiveHit(0, 0);
      
      expect(secondHit).toBe(false);
      expect(ship.getHitCount()).toBe(1);
    });

    test('should sink ship when all positions are hit', () => {
      ship.receiveHit(0, 0);
      ship.receiveHit(0, 1);
      expect(ship.isSunk()).toBe(false);
      
      ship.receiveHit(0, 2);
      expect(ship.isSunk()).toBe(true);
      expect(ship.getHitCount()).toBe(3);
    });
  });

  describe('Ship State', () => {
    test('should provide correct debug info', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.receiveHit(0, 0);

      const debugInfo = ship.getDebugInfo();
      
      expect(debugInfo).toMatchObject({
        length: 3,
        positionsCount: 2,
        hitCount: 1,
        isSunk: false
      });
      expect(debugInfo.positions).toHaveLength(2);
    });

    test('should return copy of positions array', () => {
      ship.addPosition(0, 0);
      const positions1 = ship.getPositions();
      const positions2 = ship.getPositions();
      
      expect(positions1).not.toBe(positions2); // Different references
      expect(positions1).toEqual(positions2); // Same content
    });
  });

  describe('Edge Cases', () => {
    test('should handle single-length ship', () => {
      const singleShip = new Ship(1);
      singleShip.addPosition(0, 0);
      
      expect(singleShip.isFullyPositioned()).toBe(true);
      
      const hit = singleShip.receiveHit(0, 0);
      expect(hit).toBe(true);
      expect(singleShip.isSunk()).toBe(true);
    });

    test('should handle large ship', () => {
      const largeShip = new Ship(5);
      
      for (let i = 0; i < 5; i++) {
        largeShip.addPosition(0, i);
      }
      
      expect(largeShip.isFullyPositioned()).toBe(true);
      
      // Hit all but one
      for (let i = 0; i < 4; i++) {
        largeShip.receiveHit(0, i);
      }
      expect(largeShip.isSunk()).toBe(false);
      
      // Hit the last one
      largeShip.receiveHit(0, 4);
      expect(largeShip.isSunk()).toBe(true);
    });
  });
}); 