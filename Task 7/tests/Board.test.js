import { describe, test, expect, beforeEach } from '@jest/globals';
import { Board } from '../src/models/Board.js';

describe('Board', () => {
  let board;

  beforeEach(() => {
    board = new Board(10);
  });

  describe('Constructor', () => {
    test('should create board with correct size', () => {
      expect(board.getSize()).toBe(10);
      const grid = board.getGrid();
      expect(grid).toHaveLength(10);
      expect(grid[0]).toHaveLength(10);
      
      // Check all cells are water initially
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          expect(grid[i][j]).toBe('~');
        }
      }
    });

    test('should create board with default size', () => {
      const defaultBoard = new Board();
      expect(defaultBoard.getSize()).toBe(10); // GAME_CONFIG.BOARD_SIZE
    });

    test('should throw error for invalid size', () => {
      expect(() => new Board(0)).toThrow('Board size must be a positive integer');
      expect(() => new Board(-1)).toThrow('Board size must be a positive integer');
      expect(() => new Board(1.5)).toThrow('Board size must be a positive integer');
      expect(() => new Board('10')).toThrow('Board size must be a positive integer');
    });
  });

  describe('Ship Placement', () => {
    test('should place ships randomly', () => {
      const success = board.placeShipsRandomly(3, 3);
      expect(success).toBe(true);
      
      const debugInfo = board.getDebugInfo();
      expect(debugInfo.shipsCount).toBe(3);
      expect(debugInfo.ships).toHaveLength(3);
      
      // Each ship should have 3 positions
      debugInfo.ships.forEach(ship => {
        expect(ship.positionsCount).toBe(3);
        expect(ship.length).toBe(3);
      });
    });

    test('should handle failed ship placement', () => {
      // Try to place impossible number of ships
      const success = board.placeShipsRandomly(50, 10);
      expect(success).toBe(false);
    });

    test('should not overlap ships', () => {
      board.placeShipsRandomly(3, 3);
      const debugInfo = board.getDebugInfo();
      
      // Collect all ship positions
      const allPositions = [];
      debugInfo.ships.forEach(ship => {
        ship.positions.forEach(pos => {
          allPositions.push(`${pos.row}${pos.col}`);
        });
      });

      // Check no duplicates
      const uniquePositions = new Set(allPositions);
      expect(uniquePositions.size).toBe(allPositions.length);
    });
  });

  describe('Attack Processing', () => {
    beforeEach(() => {
      // Place a ship manually for predictable testing
      board.placeShipsRandomly(1, 3);
    });

    test('should process valid attacks', () => {
      const result = board.receiveAttack(0, 0);
      expect(result.success).toBe(true);
      expect(['Hit!', 'Miss!']).toContain(result.message);
    });

    test('should prevent duplicate attacks', () => {
      board.receiveAttack(0, 0);
      const result = board.receiveAttack(0, 0);
      
      expect(result.success).toBe(false);
      expect(result.alreadyAttacked).toBe(true);
      expect(result.message).toBe('Position already attacked');
    });

    test('should throw error for invalid coordinates', () => {
      expect(() => board.receiveAttack(-1, 0)).toThrow('Invalid attack coordinates');
      expect(() => board.receiveAttack(0, -1)).toThrow('Invalid attack coordinates');
      expect(() => board.receiveAttack(10, 0)).toThrow('Invalid attack coordinates');
      expect(() => board.receiveAttack(0, 10)).toThrow('Invalid attack coordinates');
    });

    test('should track attacked positions', () => {
      board.receiveAttack(0, 0);
      board.receiveAttack(1, 1);
      
      expect(board.isPositionAttacked(0, 0)).toBe(true);
      expect(board.isPositionAttacked(1, 1)).toBe(true);
      expect(board.isPositionAttacked(2, 2)).toBe(false);
    });
  });

  describe('Ship State Management', () => {
    test('should detect when all ships are sunk', () => {
      // Empty board - no ships
      expect(board.areAllShipsSunk()).toBe(false); // No ships placed yet
      
      board.placeShipsRandomly(1, 1);
      expect(board.areAllShipsSunk()).toBe(false);
      
      // Find the ship and sink it
      const debugInfo = board.getDebugInfo();
      const shipPosition = debugInfo.ships[0].positions[0];
      board.receiveAttack(shipPosition.row, shipPosition.col);
      
      expect(board.areAllShipsSunk()).toBe(true);
    });

    test('should count remaining ships correctly', () => {
      board.placeShipsRandomly(2, 1);
      expect(board.getRemainingShipsCount()).toBe(2);
      
      // Sink one ship
      const debugInfo = board.getDebugInfo();
      const firstShipPosition = debugInfo.ships[0].positions[0];
      board.receiveAttack(firstShipPosition.row, firstShipPosition.col);
      
      expect(board.getRemainingShipsCount()).toBe(1);
    });
  });

  describe('Grid Management', () => {
    test('should return copy of grid', () => {
      const grid1 = board.getGrid();
      const grid2 = board.getGrid();
      
      expect(grid1).not.toBe(grid2); // Different references
      expect(grid1).toEqual(grid2); // Same content
    });

    test('should get cell states correctly', () => {
      expect(board.getCellState(0, 0)).toBe('~');
      
      board.receiveAttack(0, 0);
      expect(['X', 'O']).toContain(board.getCellState(0, 0));
    });

    test('should throw error for invalid cell coordinates', () => {
      expect(() => board.getCellState(-1, 0)).toThrow('Invalid coordinates');
      expect(() => board.getCellState(0, -1)).toThrow('Invalid coordinates');
      expect(() => board.getCellState(10, 0)).toThrow('Invalid coordinates');
      expect(() => board.getCellState(0, 10)).toThrow('Invalid coordinates');
    });

    test('should reveal ships when requested', () => {
      board.placeShipsRandomly(1, 3);
      board.revealShips();
      
      const grid = board.getGrid();
      let shipCells = 0;
      
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          if (grid[i][j] === 'S') {
            shipCells++;
          }
        }
      }
      
      expect(shipCells).toBe(3); // One ship with 3 positions
    });
  });

  describe('Debug Information', () => {
    test('should provide comprehensive debug info', () => {
      board.placeShipsRandomly(2, 3);
      board.receiveAttack(0, 0);
      board.receiveAttack(1, 1);
      
      const debugInfo = board.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('size', 10);
      expect(debugInfo).toHaveProperty('shipsCount', 2);
      expect(debugInfo).toHaveProperty('attackedPositions', 2);
      expect(debugInfo.ships).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    test('should handle small board', () => {
      const smallBoard = new Board(3);
      expect(smallBoard.getSize()).toBe(3);
      
      const success = smallBoard.placeShipsRandomly(1, 2);
      expect(success).toBe(true);
    });

    test('should handle single-cell ship', () => {
      const success = board.placeShipsRandomly(1, 1);
      expect(success).toBe(true);
      
      const debugInfo = board.getDebugInfo();
      expect(debugInfo.ships[0].length).toBe(1);
      expect(debugInfo.ships[0].positionsCount).toBe(1);
    });

    test('should handle maximum ships on small board', () => {
      const smallBoard = new Board(3);
      // Try to place 9 ships of length 1 on 3x3 board
      const success = smallBoard.placeShipsRandomly(9, 1);
      expect(success).toBe(true);
      
      const debugInfo = smallBoard.getDebugInfo();
      expect(debugInfo.shipsCount).toBe(9);
    });
  });
}); 