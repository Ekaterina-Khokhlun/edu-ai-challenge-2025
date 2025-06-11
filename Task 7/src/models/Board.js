import { Ship } from './Ship.js';
import { GAME_CONFIG, CELL_STATES, SHIP_ORIENTATIONS } from '../constants/GameConstants.js';
import { CoordinateUtils, RandomUtils, ArrayUtils } from '../utils/GameUtils.js';

/**
 * Класс представляющий игровое поле в игре "Морской бой"
 * Управляет состоянием поля, кораблями и логикой атак
 */
export class Board {
  #size;
  #grid;
  #ships;
  #attackedPositions;

  /**
   * Создает новое игровое поле
   * @param {number} size - размер поля (по умолчанию из конфигурации)
   */
  constructor(size = GAME_CONFIG.BOARD_SIZE) {
    this.#size = size;
    this.#grid = this.#initializeGrid();
    this.#ships = [];
    this.#attackedPositions = new Set();

    this.#validateSize(size);
  }

  /**
   * Валидирует размер поля
   * @param {number} size - размер поля
   * @private
   */
  #validateSize(size) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error('Board size must be a positive integer');
    }
  }

  /**
   * Инициализирует пустую сетку поля
   * @returns {Array} двумерный массив представляющий поле
   * @private
   */
  #initializeGrid() {
    return ArrayUtils.create2DArray(this.#size, this.#size, CELL_STATES.WATER);
  }

  /**
   * Размещает корабли случайным образом на поле
   * @param {number} shipCount - количество кораблей
   * @param {number} shipLength - длина кораблей
   * @returns {boolean} успешно ли размещены все корабли
   */
  placeShipsRandomly(shipCount = GAME_CONFIG.SHIP_COUNT, shipLength = GAME_CONFIG.SHIP_LENGTH) {
    let placedShips = 0;
    let attempts = 0;

    while (placedShips < shipCount && attempts < GAME_CONFIG.MAX_PLACEMENT_ATTEMPTS) {
      attempts++;
      
      if (this.#tryPlaceRandomShip(shipLength)) {
        placedShips++;
      }
    }

    return placedShips === shipCount;
  }

  /**
   * Пытается разместить один корабль в случайном месте
   * @param {number} shipLength - длина корабля
   * @returns {boolean} успешно ли размещен корабль
   * @private
   */
  #tryPlaceRandomShip(shipLength) {
    const orientation = RandomUtils.randomOrientation();
    const { startRow, startCol } = this.#getRandomStartPosition(shipLength, orientation);

    if (this.#canPlaceShip(startRow, startCol, shipLength, orientation)) {
      this.#placeShip(startRow, startCol, shipLength, orientation);
      return true;
    }

    return false;
  }

  /**
   * Получает случайную стартовую позицию для корабля
   * @param {number} shipLength - длина корабля
   * @param {string} orientation - ориентация корабля
   * @returns {{startRow: number, startCol: number}} стартовые координаты
   * @private
   */
  #getRandomStartPosition(shipLength, orientation) {
    const maxRow = orientation === SHIP_ORIENTATIONS.HORIZONTAL 
      ? this.#size 
      : this.#size - shipLength + 1;
    
    const maxCol = orientation === SHIP_ORIENTATIONS.HORIZONTAL 
      ? this.#size - shipLength + 1 
      : this.#size;

    return {
      startRow: RandomUtils.randomInt(0, maxRow),
      startCol: RandomUtils.randomInt(0, maxCol)
    };
  }

  /**
   * Проверяет, можно ли разместить корабль в указанном месте
   * @param {number} startRow - начальная строка
   * @param {number} startCol - начальный столбец
   * @param {number} shipLength - длина корабля
   * @param {string} orientation - ориентация корабля
   * @returns {boolean} можно ли разместить корабль
   * @private
   */
  #canPlaceShip(startRow, startCol, shipLength, orientation) {
    const positions = this.#calculateShipPositions(startRow, startCol, shipLength, orientation);
    
    return positions.every(({ row, col }) => {
      return CoordinateUtils.isValidCoordinate(row, col) && 
             this.#grid[row][col] === CELL_STATES.WATER;
    });
  }

  /**
   * Вычисляет позиции, которые займет корабль
   * @param {number} startRow - начальная строка
   * @param {number} startCol - начальный столбец
   * @param {number} shipLength - длина корабля
   * @param {string} orientation - ориентация корабля
   * @returns {Array} массив позиций корабля
   * @private
   */
  #calculateShipPositions(startRow, startCol, shipLength, orientation) {
    const positions = [];
    
    for (let i = 0; i < shipLength; i++) {
      const row = orientation === SHIP_ORIENTATIONS.HORIZONTAL ? startRow : startRow + i;
      const col = orientation === SHIP_ORIENTATIONS.HORIZONTAL ? startCol + i : startCol;
      positions.push({ row, col });
    }
    
    return positions;
  }

  /**
   * Размещает корабль на поле
   * @param {number} startRow - начальная строка
   * @param {number} startCol - начальный столбец
   * @param {number} shipLength - длина корабля
   * @param {string} orientation - ориентация корабля
   * @private
   */
  #placeShip(startRow, startCol, shipLength, orientation) {
    const ship = new Ship(shipLength);
    const positions = this.#calculateShipPositions(startRow, startCol, shipLength, orientation);

    positions.forEach(({ row, col }) => {
      ship.addPosition(row, col);
      // Корабли видны только на поле игрока
    });

    this.#ships.push(ship);
  }

  /**
   * Обрабатывает атаку по указанным координатам
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {Object} результат атаки
   */
  receiveAttack(row, col) {
    if (!CoordinateUtils.isValidCoordinate(row, col)) {
      throw new Error('Invalid attack coordinates');
    }

    const positionKey = CoordinateUtils.coordinatesToString(row, col);

    if (this.#attackedPositions.has(positionKey)) {
      return {
        success: false,
        alreadyAttacked: true,
        message: 'Position already attacked'
      };
    }

    this.#attackedPositions.add(positionKey);

    // Проверяем попадание в корабли
    const hitShip = this.#ships.find(ship => ship.hasPosition(row, col));

    if (hitShip) {
      const wasAlreadyHit = hitShip.isPositionHit(row, col);
      
      if (!wasAlreadyHit) {
        hitShip.receiveHit(row, col);
        this.#grid[row][col] = CELL_STATES.HIT;
        
        return {
          success: true,
          hit: true,
          sunk: hitShip.isSunk(),
          message: hitShip.isSunk() ? 'Ship sunk!' : 'Hit!'
        };
      }
    }

    this.#grid[row][col] = CELL_STATES.MISS;
    return {
      success: true,
      hit: false,
      message: 'Miss!'
    };
  }

  /**
   * Показывает корабли на поле (для поля игрока)
   */
  revealShips() {
    this.#ships.forEach(ship => {
      ship.getPositions().forEach(({ row, col }) => {
        if (this.#grid[row][col] === CELL_STATES.WATER) {
          this.#grid[row][col] = CELL_STATES.SHIP;
        }
      });
    });
  }

  /**
   * Проверяет, все ли корабли потоплены
   * @returns {boolean} потоплены ли все корабли
   */
  areAllShipsSunk() {
    return this.#ships.length > 0 && this.#ships.every(ship => ship.isSunk());
  }

  /**
   * Получает количество оставшихся кораблей
   * @returns {number} количество непотопленных кораблей
   */
  getRemainingShipsCount() {
    return this.#ships.filter(ship => !ship.isSunk()).length;
  }

  /**
   * Получает размер поля
   * @returns {number} размер поля
   */
  getSize() {
    return this.#size;
  }

  /**
   * Получает копию сетки поля
   * @returns {Array} копия сетки
   */
  getGrid() {
    return ArrayUtils.deepCopy2DArray(this.#grid);
  }

  /**
   * Получает состояние ячейки
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {string} состояние ячейки
   */
  getCellState(row, col) {
    if (!CoordinateUtils.isValidCoordinate(row, col)) {
      throw new Error('Invalid coordinates');
    }
    return this.#grid[row][col];
  }

  /**
   * Проверяет, была ли атакована позиция
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} была ли атакована позиция
   */
  isPositionAttacked(row, col) {
    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    return this.#attackedPositions.has(positionKey);
  }

  /**
   * Получает информацию о состоянии поля для отладки
   * @returns {Object} информация о поле
   */
  getDebugInfo() {
    return {
      size: this.#size,
      shipsCount: this.#ships.length,
      sunkShips: this.#ships.filter(ship => ship.isSunk()).length,
      attackedPositions: this.#attackedPositions.size,
      ships: this.#ships.map(ship => ship.getDebugInfo())
    };
  }

  /**
   * Обновляет состояние ячейки поля
   * @param {number} row - строка
   * @param {number} col - столбец
   * @param {string} state - новое состояние ячейки
   */
  setCellState(row, col, state) {
    if (!CoordinateUtils.isValidCoordinate(row, col)) {
      throw new Error('Invalid coordinates');
    }
    this.#grid[row][col] = state;
  }
} 