import { describe, test, expect, beforeEach } from '@jest/globals';
import { AIStrategy } from '../src/strategies/AIStrategy.js';

describe('AIStrategy', () => {
  let aiStrategy;

  beforeEach(() => {
    aiStrategy = new AIStrategy(10);
  });

  describe('Constructor', () => {
    test('should initialize with correct board size', () => {
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.mode).toBe('hunt');
      expect(debugInfo.targetQueueSize).toBe(0);
      expect(debugInfo.attackedPositionsCount).toBe(0);
      expect(debugInfo.hitStreakLength).toBe(0);
    });

    test('should throw error for invalid board size', () => {
      expect(() => new AIStrategy(0)).toThrow('Board size must be a positive integer');
      expect(() => new AIStrategy(-1)).toThrow('Board size must be a positive integer');
      expect(() => new AIStrategy(1.5)).toThrow('Board size must be a positive integer');
      expect(() => new AIStrategy('10')).toThrow('Board size must be a positive integer');
    });
  });

  describe('Move Generation', () => {
    test('should generate valid moves in hunt mode', async () => {
      const move = await aiStrategy.generateMove();
      
      expect(move).toHaveProperty('row');
      expect(move).toHaveProperty('col');
      expect(move.row).toBeGreaterThanOrEqual(0);
      expect(move.row).toBeLessThan(10);
      expect(move.col).toBeGreaterThanOrEqual(0);
      expect(move.col).toBeLessThan(10);
    });

    test('should not repeat moves', async () => {
      const moves = new Set();
      
      // Generate several moves and ensure they're unique
      for (let i = 0; i < 10; i++) {
        const move = await aiStrategy.generateMove();
        const moveKey = `${move.row}${move.col}`;
        expect(moves.has(moveKey)).toBe(false);
        moves.add(moveKey);
      }
    });

    test('should handle full board scenario', async () => {
      // Fill the entire board with attacks except one position
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (row !== 9 || col !== 9) { // Leave (9,9) free
            aiStrategy.processAttackResult(row, col, false, false);
          }
        }
      }

      const move = await aiStrategy.generateMove();
      expect(move.row).toBe(9);
      expect(move.col).toBe(9);
    });

    test('should return null when no moves available', async () => {
      // Fill the entire board
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          aiStrategy.processAttackResult(row, col, false, false);
        }
      }

      const move = await aiStrategy.generateMove();
      expect(move).toBeNull();
    });
  });

  describe('Attack Result Processing', () => {
    test('should switch to target mode on hit', () => {
      aiStrategy.processAttackResult(5, 5, true, false);
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.mode).toBe('target');
      expect(debugInfo.targetQueueSize).toBeGreaterThan(0);
      expect(debugInfo.hitStreakLength).toBe(1);
    });

    test('should switch to hunt mode on ship sunk', () => {
      // First hit
      aiStrategy.processAttackResult(5, 5, true, false);
      expect(aiStrategy.getCurrentMode()).toBe('target');
      
      // Sink the ship
      aiStrategy.processAttackResult(5, 6, true, true);
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.targetQueueSize).toBe(0);
      expect(debugInfo.hitStreakLength).toBe(0);
    });

    test('should remain in hunt mode on miss', () => {
      aiStrategy.processAttackResult(5, 5, false, false);
      
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.targetQueueSize).toBe(0);
      expect(debugInfo.hitStreakLength).toBe(0);
    });

    test('should add adjacent targets on hit', () => {
      aiStrategy.processAttackResult(5, 5, true, false);
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.targetQueueSize).toBe(4); // Four adjacent cells
    });

    test('should prioritize directional targets after multiple hits', () => {
      // Two hits in a horizontal line
      aiStrategy.processAttackResult(5, 5, true, false);
      aiStrategy.processAttackResult(5, 6, true, false);
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.mode).toBe('target');
      expect(debugInfo.targetQueueSize).toBeGreaterThan(0);
    });
  });

  describe('Target Queue Management', () => {
    test('should manage target queue correctly', () => {
      // Hit in the middle of the board
      aiStrategy.processAttackResult(5, 5, true, false);
      
      expect(aiStrategy.getTargetQueueSize()).toBe(4);
      expect(aiStrategy.getCurrentMode()).toBe('target');
    });

    test('should handle corner hits with fewer adjacent targets', () => {
      // Hit in corner
      aiStrategy.processAttackResult(0, 0, true, false);
      
      expect(aiStrategy.getTargetQueueSize()).toBe(2); // Only 2 adjacent cells available
    });

    test('should handle edge hits', () => {
      // Hit on edge
      aiStrategy.processAttackResult(0, 5, true, false);
      
      expect(aiStrategy.getTargetQueueSize()).toBe(3); // 3 adjacent cells available
    });
  });

  describe('Mode Transitions', () => {
    test('should transition from hunt to target correctly', () => {
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      
      aiStrategy.processAttackResult(5, 5, true, false);
      expect(aiStrategy.getCurrentMode()).toBe('target');
    });

    test('should transition from target back to hunt on ship sunk', () => {
      aiStrategy.processAttackResult(5, 5, true, false);
      expect(aiStrategy.getCurrentMode()).toBe('target');
      
      aiStrategy.processAttackResult(5, 6, true, true);
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
    });

    test('should stay in target mode with remaining targets', () => {
      aiStrategy.processAttackResult(5, 5, true, false);
      expect(aiStrategy.getCurrentMode()).toBe('target');
      
      aiStrategy.processAttackResult(5, 4, false, false); // Miss
      expect(aiStrategy.getCurrentMode()).toBe('target'); // Still have targets
    });
  });

  describe('Edge Cases', () => {
    test('should handle small board', () => {
      const smallAI = new AIStrategy(3);
      expect(() => smallAI.processAttackResult(1, 1, true, false)).not.toThrow();
      
      const debugInfo = smallAI.getDebugInfo();
      expect(debugInfo.mode).toBe('target');
    });

    test('should handle single cell board', () => {
      const tinyAI = new AIStrategy(1);
      expect(() => tinyAI.processAttackResult(0, 0, true, true)).not.toThrow();
    });

    test('should handle multiple consecutive hits', () => {
      // Simulate hitting a long ship
      aiStrategy.processAttackResult(5, 5, true, false);
      aiStrategy.processAttackResult(5, 6, true, false);
      aiStrategy.processAttackResult(5, 7, true, false);
      aiStrategy.processAttackResult(5, 8, true, true); // Sink
      
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.hitStreakLength).toBe(0);
      expect(debugInfo.targetQueueSize).toBe(0);
    });
  });

  describe('Random Move Generation', () => {
    test('should generate different moves over multiple calls', async () => {
      const moves = [];
      
      for (let i = 0; i < 5; i++) {
        const move = await aiStrategy.generateMove();
        moves.push(`${move.row}${move.col}`);
      }
      
      // At least some moves should be different (very high probability)
      const uniqueMoves = new Set(moves);
      expect(uniqueMoves.size).toBeGreaterThan(1);
    });

    test('should generate moves within board bounds', async () => {
      for (let i = 0; i < 20; i++) {
        const move = await aiStrategy.generateMove();
        
        expect(move.row).toBeGreaterThanOrEqual(0);
        expect(move.row).toBeLessThan(10);
        expect(move.col).toBeGreaterThanOrEqual(0);
        expect(move.col).toBeLessThan(10);
      }
    });
  });

  describe('Debug Information', () => {
    test('should provide comprehensive debug info', () => {
      aiStrategy.processAttackResult(5, 5, true, false);
      aiStrategy.processAttackResult(5, 6, true, false);
      
      const debugInfo = aiStrategy.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('mode');
      expect(debugInfo).toHaveProperty('targetQueueSize');
      expect(debugInfo).toHaveProperty('attackedPositionsCount');
      expect(debugInfo).toHaveProperty('hitStreakLength');
      expect(debugInfo).toHaveProperty('lastHitPosition');
      
      expect(debugInfo.mode).toBe('target');
      expect(debugInfo.hitStreakLength).toBe(2);
      expect(debugInfo.lastHitPosition).toEqual({ row: 5, col: 6 });
    });
  });
}); 