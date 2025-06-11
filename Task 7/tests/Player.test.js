import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Player } from '../src/models/Player.js';

describe('Player', () => {
  let humanPlayer;
  let aiPlayer;

  beforeEach(() => {
    humanPlayer = new Player('TestPlayer', 'human', 10);
    aiPlayer = new Player('TestAI', 'ai', 10);
  });

  describe('Constructor', () => {
    test('should create human player correctly', () => {
      expect(humanPlayer.getName()).toBe('TestPlayer');
      expect(humanPlayer.getType()).toBe('human');
      expect(humanPlayer.isAI()).toBe(false);
      expect(humanPlayer.getOwnBoard()).toBeDefined();
      expect(humanPlayer.getOpponentBoard()).toBeDefined();
    });

    test('should create AI player correctly', () => {
      expect(aiPlayer.getName()).toBe('TestAI');
      expect(aiPlayer.getType()).toBe('ai');
      expect(aiPlayer.isAI()).toBe(true);
      expect(aiPlayer.getAIStrategyInfo()).toBeDefined();
    });

    test('should throw error for invalid name', () => {
      expect(() => new Player('', 'human')).toThrow('Player name must be a non-empty string');
      expect(() => new Player(null, 'human')).toThrow('Player name must be a non-empty string');
      expect(() => new Player(123, 'human')).toThrow('Player name must be a non-empty string');
    });

    test('should throw error for invalid type', () => {
      expect(() => new Player('Test', 'invalid')).toThrow('Invalid player type');
      expect(() => new Player('Test', null)).toThrow('Invalid player type');
    });
  });

  describe('Ship Placement', () => {
    test('should place ships successfully', async () => {
      const success = await humanPlayer.placeShips(3, 3);
      expect(success).toBe(true);
      
      const board = humanPlayer.getOwnBoard();
      const debugInfo = board.getDebugInfo();
      expect(debugInfo.shipsCount).toBe(3);
    });

    test('should reveal ships for human players', async () => {
      await humanPlayer.placeShips(1, 3);
      
      const grid = humanPlayer.getOwnBoard().getGrid();
      let shipCells = 0;
      
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if (grid[i][j] === 'S') {
            shipCells++;
          }
        }
      }
      
      expect(shipCells).toBe(3); // Ships should be visible
    });

    test('should not reveal ships for AI players', async () => {
      await aiPlayer.placeShips(1, 3);
      
      const grid = aiPlayer.getOwnBoard().getGrid();
      let shipCells = 0;
      
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if (grid[i][j] === 'S') {
            shipCells++;
          }
        }
      }
      
      expect(shipCells).toBe(0); // Ships should be hidden
    });
  });

  describe('Human Player Validation', () => {
    test('should validate correct input', () => {
      const result = humanPlayer.validateHumanMove('34');
      expect(result.isValid).toBe(true);
      expect(result.coordinates).toEqual({ row: 3, col: 4 });
    });

    test('should reject invalid input format', () => {
      let result = humanPlayer.validateHumanMove('3');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('exactly two digits');

      result = humanPlayer.validateHumanMove('ab');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('digits');
    });

    test('should reject out of bounds input', () => {
      const result = humanPlayer.validateHumanMove('aa'); // Invalid format
      expect(result.isValid).toBe(false);
    });

    test('should reject duplicate attacks', () => {
      // Simulate an attacked position
      humanPlayer.getOpponentBoard().receiveAttack(3, 4);
      
      const result = humanPlayer.validateHumanMove('34');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('already attacked');
    });

    test('should throw error for AI trying to validate human moves', () => {
      expect(() => aiPlayer.validateHumanMove('34')).toThrow('Only human players can validate manual input');
    });
  });

  describe('AI Move Generation', () => {
    test('should generate moves for AI player', async () => {
      const move = await aiPlayer.generateMove();
      expect(move).toHaveProperty('row');
      expect(move).toHaveProperty('col');
      expect(move.row).toBeGreaterThanOrEqual(0);
      expect(move.row).toBeLessThan(10);
      expect(move.col).toBeGreaterThanOrEqual(0);
      expect(move.col).toBeLessThan(10);
    });

    test('should throw error for human trying to generate moves', async () => {
      await expect(humanPlayer.generateMove()).rejects.toThrow('Human players cannot generate moves automatically');
    });

    test('should throw error if AI strategy not initialized', async () => {
      const brokenPlayer = new Player('Broken', 'human', 10);
      // Force the type to AI without proper initialization
      brokenPlayer.getType = () => 'ai';
      
      await expect(brokenPlayer.generateMove()).rejects.toThrow('AI strategy not initialized');
    });
  });

  describe('Attack Execution', () => {
    let opponent;

    beforeEach(async () => {
      opponent = new Player('Opponent', 'human', 10);
      await opponent.placeShips(1, 3);
    });

    test('should execute attack successfully', async () => {
      const result = await humanPlayer.performAttack(0, 0, opponent);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('message');
      
      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(1);
    });

    test('should update statistics on attack', async () => {
      await humanPlayer.performAttack(0, 0, opponent);
      await humanPlayer.performAttack(1, 1, opponent);
      
      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(2);
      expect(stats.accuracy).toBeGreaterThanOrEqual(0);
      expect(stats.accuracy).toBeLessThanOrEqual(100);
    });

    test('should throw error for invalid attack coordinates', async () => {
      await expect(humanPlayer.performAttack(-1, 0, opponent)).rejects.toThrow('Invalid attack coordinates');
      await expect(humanPlayer.performAttack(10, 0, opponent)).rejects.toThrow('Invalid attack coordinates');
    });
  });

  describe('Ship State Management', () => {
    beforeEach(async () => {
      await humanPlayer.placeShips(2, 1); // 2 ships of length 1
    });

    test('should track remaining ships', () => {
      expect(humanPlayer.hasRemainingShips()).toBe(true);
      expect(humanPlayer.getRemainingShipsCount()).toBe(2);
    });

    test('should detect when all ships are sunk', () => {
      // Sink all ships by attacking all positions
      const debugInfo = humanPlayer.getOwnBoard().getDebugInfo();
      debugInfo.ships.forEach(ship => {
        ship.positions.forEach(pos => {
          humanPlayer.receiveAttack(pos.row, pos.col);
        });
      });
      
      expect(humanPlayer.hasRemainingShips()).toBe(false);
      expect(humanPlayer.getRemainingShipsCount()).toBe(0);
    });
  });

  describe('Statistics Management', () => {
    test('should initialize statistics correctly', () => {
      const stats = humanPlayer.getStatistics();
      
      expect(stats).toMatchObject({
        totalShots: 0,
        hits: 0,
        misses: 0,
        shipsSunk: 0,
        accuracy: 0
      });
    });

    test('should update statistics correctly', async () => {
      const opponent = new Player('Opponent', 'human', 10);
      await opponent.placeShips(1, 1);
      
      // Make some attacks
      await humanPlayer.performAttack(0, 0, opponent);
      await humanPlayer.performAttack(1, 1, opponent);
      
      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(2);
      expect(stats.accuracy).toBeGreaterThanOrEqual(0);
    });

    test('should return copy of statistics', () => {
      const stats1 = humanPlayer.getStatistics();
      const stats2 = humanPlayer.getStatistics();
      
      expect(stats1).not.toBe(stats2); // Different references
      expect(stats1).toEqual(stats2); // Same content
    });
  });

  describe('AI Strategy Integration', () => {
    test('should provide AI strategy info for AI players', () => {
      const strategyInfo = aiPlayer.getAIStrategyInfo();
      expect(strategyInfo).toBeDefined();
      expect(strategyInfo).toHaveProperty('mode');
      expect(strategyInfo).toHaveProperty('targetQueueSize');
    });

    test('should return null strategy info for human players', () => {
      const strategyInfo = humanPlayer.getAIStrategyInfo();
      expect(strategyInfo).toBeNull();
    });
  });

  describe('Player Reset', () => {
    test('should reset player state correctly', async () => {
      // Set up some game state
      await humanPlayer.placeShips(1, 3);
      const opponent = new Player('Opponent', 'human', 10);
      await opponent.placeShips(1, 1);
      
      await humanPlayer.performAttack(0, 0, opponent);
      
      // Reset
      humanPlayer.reset();
      
      // Check state is reset
      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(0);
      expect(stats.hits).toBe(0);
      
      const debugInfo = humanPlayer.getOwnBoard().getDebugInfo();
      expect(debugInfo.shipsCount).toBe(0);
    });
  });

  describe('Debug Information', () => {
    test('should provide comprehensive debug info', async () => {
      await humanPlayer.placeShips(1, 3);
      
      const debugInfo = humanPlayer.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('name', 'TestPlayer');
      expect(debugInfo).toHaveProperty('type', 'human');
      expect(debugInfo).toHaveProperty('statistics');
      expect(debugInfo).toHaveProperty('ownBoard');
      expect(debugInfo.aiStrategy).toBeNull(); // Human player
    });

    test('should include AI strategy in debug info for AI players', async () => {
      const debugInfo = aiPlayer.getDebugInfo();
      
      expect(debugInfo.aiStrategy).toBeDefined();
      expect(debugInfo.aiStrategy).toHaveProperty('mode');
    });
  });
}); 