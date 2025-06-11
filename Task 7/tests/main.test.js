/**
 * Основные unit-тесты для игры "Морской бой"
 * Покрывают ключевые модули и функциональность
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Импорт тестируемых модулей
import { Ship } from '../src/models/Ship.js';
import { Board } from '../src/models/Board.js';
import { Player } from '../src/models/Player.js';
import { CoordinateUtils, ValidationUtils, ArrayUtils } from '../src/utils/GameUtils.js';
import { AIStrategy } from '../src/strategies/AIStrategy.js';
import { GameRenderer } from '../src/views/GameRenderer.js';

describe('Sea Battle Game - Core Modules Test Suite', () => {

  // ===========================================
  // SHIP MODULE TESTS
  // ===========================================
  describe('Ship Module', () => {
    let ship;

    beforeEach(() => {
      ship = new Ship(3);
    });

    test('should create ship with correct initial state', () => {
      expect(ship.getLength()).toBe(3);
      expect(ship.getPositions()).toHaveLength(0);
      expect(ship.getHitCount()).toBe(0);
      expect(ship.isSunk()).toBe(false);
      expect(ship.isFullyPositioned()).toBe(false);
    });

    test('should handle position management correctly', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.addPosition(0, 2);

      expect(ship.getPositions()).toHaveLength(3);
      expect(ship.isFullyPositioned()).toBe(true);
      expect(ship.hasPosition(0, 0)).toBe(true);
      expect(ship.hasPosition(1, 0)).toBe(false);
    });

    test('should handle hits and sinking correctly', () => {
      ship.addPosition(0, 0);
      ship.addPosition(0, 1);
      ship.addPosition(0, 2);

      // First hit
      expect(ship.receiveHit(0, 0)).toBe(true);
      expect(ship.getHitCount()).toBe(1);
      expect(ship.isSunk()).toBe(false);

      // Second hit
      expect(ship.receiveHit(0, 1)).toBe(true);
      expect(ship.getHitCount()).toBe(2);
      expect(ship.isSunk()).toBe(false);

      // Final hit - ship sunk
      expect(ship.receiveHit(0, 2)).toBe(true);
      expect(ship.getHitCount()).toBe(3);
      expect(ship.isSunk()).toBe(true);
    });

    test('should validate inputs correctly', () => {
      expect(() => new Ship(0)).toThrow();
      expect(() => new Ship(-1)).toThrow();
      expect(() => ship.addPosition(-1, 0)).toThrow();
      expect(() => ship.addPosition(10, 0)).toThrow();
    });
  });

  // ===========================================
  // BOARD MODULE TESTS
  // ===========================================
  describe('Board Module', () => {
    let board;

    beforeEach(() => {
      board = new Board(10);
    });

    test('should initialize correctly', () => {
      expect(board.getSize()).toBe(10);
      const grid = board.getGrid();
      expect(grid).toHaveLength(10);
      expect(grid[0]).toHaveLength(10);
      expect(grid[0][0]).toBe('~');
    });

    test('should place ships without overlap', () => {
      const success = board.placeShipsRandomly(3, 3);
      expect(success).toBe(true);

      const debugInfo = board.getDebugInfo();
      expect(debugInfo.shipsCount).toBe(3);

      // Verify no position overlaps
      const allPositions = [];
      debugInfo.ships.forEach(ship => {
        ship.positions.forEach(pos => {
          allPositions.push(`${pos.row}${pos.col}`);
        });
      });
      const uniquePositions = new Set(allPositions);
      expect(uniquePositions.size).toBe(allPositions.length);
    });

    test('should handle attacks correctly', () => {
      board.placeShipsRandomly(1, 3);
      
      const result = board.receiveAttack(0, 0);
      expect(result.success).toBe(true);
      expect(['Hit!', 'Miss!']).toContain(result.message);
      
      // Duplicate attack
      const duplicate = board.receiveAttack(0, 0);
      expect(duplicate.success).toBe(false);
      expect(duplicate.alreadyAttacked).toBe(true);
    });

    test('should detect game end conditions', () => {
      board.placeShipsRandomly(1, 1);
      expect(board.areAllShipsSunk()).toBe(false);
      
      // Find and sink the ship
      const debugInfo = board.getDebugInfo();
      const shipPos = debugInfo.ships[0].positions[0];
      board.receiveAttack(shipPos.row, shipPos.col);
      expect(board.areAllShipsSunk()).toBe(true);
    });
  });

  // ===========================================
  // GAME UTILS TESTS
  // ===========================================
  describe('Game Utils Module', () => {
    describe('CoordinateUtils', () => {
      test('should validate coordinates correctly', () => {
        expect(CoordinateUtils.isValidCoordinate(0, 0)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(9, 9)).toBe(true);
        expect(CoordinateUtils.isValidCoordinate(-1, 0)).toBe(false);
        expect(CoordinateUtils.isValidCoordinate(10, 0)).toBe(false);
      });

      test('should parse coordinate strings correctly', () => {
        expect(CoordinateUtils.parseCoordinates('34')).toEqual({ row: 3, col: 4 });
        expect(CoordinateUtils.parseCoordinates('00')).toEqual({ row: 0, col: 0 });
        expect(CoordinateUtils.parseCoordinates('99')).toEqual({ row: 9, col: 9 });
        expect(CoordinateUtils.parseCoordinates('ab')).toBeNull();
        expect(CoordinateUtils.parseCoordinates('123')).toBeNull();
      });

      test('should convert coordinates to strings', () => {
        expect(CoordinateUtils.coordinatesToString(3, 4)).toBe('34');
        expect(CoordinateUtils.coordinatesToString(0, 0)).toBe('00');
        expect(CoordinateUtils.coordinatesToString(9, 9)).toBe('99');
      });

      test('should find adjacent coordinates', () => {
        const adjacent = CoordinateUtils.getAdjacentCoordinates(5, 5);
        expect(adjacent).toHaveLength(4);
        expect(adjacent).toContainEqual({ row: 4, col: 5 });
        expect(adjacent).toContainEqual({ row: 6, col: 5 });
        expect(adjacent).toContainEqual({ row: 5, col: 4 });
        expect(adjacent).toContainEqual({ row: 5, col: 6 });

        // Corner case
        const cornerAdjacent = CoordinateUtils.getAdjacentCoordinates(0, 0);
        expect(cornerAdjacent).toHaveLength(2);
      });
    });

    describe('ValidationUtils', () => {
      test('should validate coordinate input correctly', () => {
        expect(ValidationUtils.validateCoordinateInput('34').isValid).toBe(true);
        expect(ValidationUtils.validateCoordinateInput('00').isValid).toBe(true);
        expect(ValidationUtils.validateCoordinateInput('3').isValid).toBe(false);
        expect(ValidationUtils.validateCoordinateInput('abc').isValid).toBe(false);
        expect(ValidationUtils.validateCoordinateInput('').isValid).toBe(false);
      });
    });

    describe('ArrayUtils', () => {
      test('should create 2D arrays correctly', () => {
        const array = ArrayUtils.create2DArray(3, 4, 'test');
        expect(array).toHaveLength(3);
        expect(array[0]).toHaveLength(4);
        expect(array[0][0]).toBe('test');
        expect(array[2][3]).toBe('test');
      });

      test('should deep copy 2D arrays', () => {
        const original = [['a', 'b'], ['c', 'd']];
        const copy = ArrayUtils.deepCopy2DArray(original);
        
        expect(copy).toEqual(original);
        expect(copy).not.toBe(original);
        expect(copy[0]).not.toBe(original[0]);
        
        copy[0][0] = 'modified';
        expect(original[0][0]).toBe('a');
      });
    });
  });

  // ===========================================
  // AI STRATEGY TESTS
  // ===========================================
  describe('AI Strategy Module', () => {
    let aiStrategy;

    beforeEach(() => {
      aiStrategy = new AIStrategy(10);
    });

    test('should initialize with correct default state', () => {
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      expect(aiStrategy.getTargetQueueSize()).toBe(0);
      
      const debugInfo = aiStrategy.getDebugInfo();
      expect(debugInfo.mode).toBe('hunt');
      expect(debugInfo.attackedPositionsCount).toBe(0);
    });

    test('should generate valid moves', async () => {
      const move = await aiStrategy.generateMove();
      expect(move).toHaveProperty('row');
      expect(move).toHaveProperty('col');
      expect(move.row).toBeGreaterThanOrEqual(0);
      expect(move.row).toBeLessThan(10);
      expect(move.col).toBeGreaterThanOrEqual(0);
      expect(move.col).toBeLessThan(10);
    });

    test('should handle mode transitions correctly', () => {
      // Hit should switch to target mode
      aiStrategy.processAttackResult(5, 5, true, false);
      expect(aiStrategy.getCurrentMode()).toBe('target');
      expect(aiStrategy.getTargetQueueSize()).toBeGreaterThan(0);

      // Sinking should switch back to hunt mode
      aiStrategy.processAttackResult(5, 6, true, true);
      expect(aiStrategy.getCurrentMode()).toBe('hunt');
      expect(aiStrategy.getTargetQueueSize()).toBe(0);
    });

    test('should not repeat moves', async () => {
      const moves = new Set();
      
      for (let i = 0; i < 10; i++) {
        const move = await aiStrategy.generateMove();
        const moveKey = `${move.row}${move.col}`;
        expect(moves.has(moveKey)).toBe(false);
        moves.add(moveKey);
      }
    });
  });

  // ===========================================
  // PLAYER MODULE TESTS
  // ===========================================
  describe('Player Module', () => {
    let humanPlayer;
    let aiPlayer;

    beforeEach(() => {
      humanPlayer = new Player('Human', 'human', 10);
      aiPlayer = new Player('AI', 'ai', 10);
    });

    test('should create players with correct properties', () => {
      expect(humanPlayer.getName()).toBe('Human');
      expect(humanPlayer.getType()).toBe('human');
      expect(humanPlayer.isAI()).toBe(false);
      
      expect(aiPlayer.getName()).toBe('AI');
      expect(aiPlayer.getType()).toBe('ai');
      expect(aiPlayer.isAI()).toBe(true);
    });

    test('should validate human moves correctly', () => {
      const validResult = humanPlayer.validateHumanMove('34');
      expect(validResult.isValid).toBe(true);
      expect(validResult.coordinates).toEqual({ row: 3, col: 4 });

      const invalidResult = humanPlayer.validateHumanMove('ab');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.message).toBeDefined();
    });

    test('should place ships correctly', async () => {
      const success = await humanPlayer.placeShips(3, 3);
      expect(success).toBe(true);
      expect(humanPlayer.hasRemainingShips()).toBe(true);
      expect(humanPlayer.getRemainingShipsCount()).toBe(3);
    });

    test('should generate AI moves', async () => {
      const move = await aiPlayer.generateMove();
      expect(move).toHaveProperty('row');
      expect(move).toHaveProperty('col');
    });

    test('should handle attacks between players', async () => {
      await humanPlayer.placeShips(1, 3);
      await aiPlayer.placeShips(1, 3);

      const result = await humanPlayer.performAttack(0, 0, aiPlayer);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('message');

      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(1);
    });

    test('should track statistics correctly', async () => {
      const opponent = new Player('Opponent', 'human', 10);
      await opponent.placeShips(1, 1);

      await humanPlayer.performAttack(0, 0, opponent);
      await humanPlayer.performAttack(1, 1, opponent);

      const stats = humanPlayer.getStatistics();
      expect(stats.totalShots).toBe(2);
      expect(stats.accuracy).toBeGreaterThanOrEqual(0);
      expect(stats.accuracy).toBeLessThanOrEqual(100);
    });
  });

  // ===========================================
  // GAME RENDERER TESTS
  // ===========================================
  describe('Game Renderer Module', () => {
    let renderer;

    beforeEach(() => {
      renderer = new GameRenderer(10);
    });

    test('should initialize with correct board size', () => {
      expect(renderer).toBeDefined();
      // Most renderer methods are console.log calls, so we test they don't throw
      expect(() => renderer.displayWelcomeMessage()).not.toThrow();
      expect(() => renderer.displayInitializationMessage()).not.toThrow();
    });

    test('should handle board display', () => {
      const playerBoard = ArrayUtils.create2DArray(10, 10, '~');
      const opponentBoard = ArrayUtils.create2DArray(10, 10, '~');
      
      expect(() => renderer.displayBoards(playerBoard, opponentBoard)).not.toThrow();
    });

    test('should display game messages', () => {
      expect(() => renderer.displayPlayerVictory()).not.toThrow();
      expect(() => renderer.displayAIVictory()).not.toThrow();
      expect(() => renderer.displayError('Test error')).not.toThrow();
    });

    test('should return coordinate prompt', () => {
      const prompt = renderer.displayCoordinatePrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // INTEGRATION TESTS
  // ===========================================
  describe('Integration Tests', () => {
    test('should handle complete game flow', async () => {
      const player1 = new Player('Player1', 'human', 10);
      const player2 = new Player('Player2', 'ai', 10);

      // Place ships
      await player1.placeShips(1, 1);
      await player2.placeShips(1, 1);

      // Validate both have ships
      expect(player1.hasRemainingShips()).toBe(true);
      expect(player2.hasRemainingShips()).toBe(true);

      // Player 1 attacks
      const attackResult = await player1.performAttack(0, 0, player2);
      expect(attackResult.success).toBe(true);

      // AI generates move
      const aiMove = await player2.generateMove();
      expect(aiMove).toHaveProperty('row');
      expect(aiMove).toHaveProperty('col');

      // Statistics are updated
      const stats = player1.getStatistics();
      expect(stats.totalShots).toBe(1);
    });

    test('should handle game end scenarios', async () => {
      const player = new Player('Player', 'human', 10);
      await player.placeShips(1, 1);

      // Find and sink the ship
      const board = player.getOwnBoard();
      const debugInfo = board.getDebugInfo();
      const shipPos = debugInfo.ships[0].positions[0];
      
      const result = board.receiveAttack(shipPos.row, shipPos.col);
      expect(result.hit).toBe(true);
      expect(result.sunk).toBe(true);
      expect(player.hasRemainingShips()).toBe(false);
    });

    test('should validate coordinate flow', () => {
      const input = '34';
      const coordinates = CoordinateUtils.parseCoordinates(input);
      expect(coordinates).not.toBeNull();
      
      const isValid = CoordinateUtils.isValidCoordinate(coordinates.row, coordinates.col);
      expect(isValid).toBe(true);
      
      const validation = ValidationUtils.validateCoordinateInput(input);
      expect(validation.isValid).toBe(true);
    });
  });
});

// ===========================================
// COVERAGE AND PERFORMANCE TESTS
// ===========================================
describe('Coverage and Performance Tests', () => {
  test('should handle error conditions gracefully', () => {
    // Test error handling in various modules
    expect(() => new Ship(0)).toThrow();
    expect(() => new Board(-1)).toThrow();
    expect(() => new Player('', 'human')).toThrow();
    expect(() => new AIStrategy(0)).toThrow();
  });

  test('should handle edge cases', async () => {
    // Small board
    const smallBoard = new Board(3);
    expect(smallBoard.placeShipsRandomly(1, 1)).toBe(true);

    // Single ship
    const ship = new Ship(1);
    ship.addPosition(0, 0);
    expect(ship.receiveHit(0, 0)).toBe(true);
    expect(ship.isSunk()).toBe(true);

    // Corner coordinates
    const corner = CoordinateUtils.getAdjacentCoordinates(0, 0);
    expect(corner.length).toBe(2);
  });

  test('should maintain data integrity', () => {
    const ship = new Ship(3);
    ship.addPosition(0, 0);
    
    // Returned arrays should be copies
    const positions1 = ship.getPositions();
    const positions2 = ship.getPositions();
    expect(positions1).not.toBe(positions2);
    expect(positions1).toEqual(positions2);
  });
}); 