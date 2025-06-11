import { AI_MODES } from '../constants/GameConstants.js';
import { CoordinateUtils, RandomUtils } from '../utils/GameUtils.js';

/**
 * Стратегия ИИ для игры "Морской бой"
 * Реализует интеллектуальный алгоритм поиска и атаки кораблей
 */
export class AIStrategy {
  #mode;
  #targetQueue;
  #attackedPositions;
  #boardSize;
  #lastHitPosition;
  #hitStreak;

  /**
   * Создает новую стратегию ИИ
   * @param {number} boardSize - размер игрового поля
   */
  constructor(boardSize) {
    this.#mode = AI_MODES.HUNT;
    this.#targetQueue = [];
    this.#attackedPositions = new Set();
    this.#boardSize = boardSize;
    this.#lastHitPosition = null;
    this.#hitStreak = [];

    this.#validateBoardSize(boardSize);
  }

  /**
   * Валидирует размер поля
   * @param {number} boardSize - размер поля
   * @private
   */
  #validateBoardSize(boardSize) {
    if (!Number.isInteger(boardSize) || boardSize <= 0) {
      throw new Error('Board size must be a positive integer');
    }
  }

  /**
   * Генерирует следующий ход ИИ
   * @returns {Promise<{row: number, col: number}>} координаты атаки
   */
  async generateMove() {
    return new Promise((resolve) => {
      const move = this.#mode === AI_MODES.TARGET && this.#targetQueue.length > 0
        ? this.#generateTargetMove()
        : this.#generateHuntMove();

      if (move) {
        this.#attackedPositions.add(CoordinateUtils.coordinatesToString(move.row, move.col));
        resolve(move);
      } else {
        // Fallback к случайному ходу если не можем найти валидный
        const fallbackMove = this.#generateFallbackMove();
        if (fallbackMove) {
          this.#attackedPositions.add(CoordinateUtils.coordinatesToString(fallbackMove.row, fallbackMove.col));
          resolve(fallbackMove);
        } else {
          resolve(null); // Не можем сделать ход
        }
      }
    });
  }

  /**
   * Генерирует ход в режиме целенаправленной атаки
   * @returns {{row: number, col: number} | null} координаты атаки
   * @private
   */
  #generateTargetMove() {
    while (this.#targetQueue.length > 0) {
      const target = this.#targetQueue.shift();
      const coordinates = CoordinateUtils.parseCoordinates(target);
      
      if (coordinates && !this.#isPositionAttacked(coordinates.row, coordinates.col)) {
        return coordinates;
      }
    }

    // Если очередь пуста, переключаемся в режим охоты
    this.#switchToHuntMode();
    return null;
  }

  /**
   * Генерирует ход в режиме поиска
   * @returns {{row: number, col: number} | null} координаты атаки
   * @private
   */
  #generateHuntMove() {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      // Используем шахматный паттерн для более эффективного поиска
      const move = this.#generateChessboardPatternMove() || this.#generateRandomMove();
      
      if (move && !this.#isPositionAttacked(move.row, move.col)) {
        return move;
      }
    }

    return null;
  }

  /**
   * Генерирует ход по шахматному паттерну (более эффективно для поиска кораблей)
   * @returns {{row: number, col: number} | null} координаты атаки
   * @private
   */
  #generateChessboardPatternMove() {
    const availableCheckerboardPositions = [];

    for (let row = 0; row < this.#boardSize; row++) {
      for (let col = 0; col < this.#boardSize; col++) {
        // Шахматный паттерн: атакуем только клетки где (row + col) четное
        if ((row + col) % 2 === 0 && !this.#isPositionAttacked(row, col)) {
          availableCheckerboardPositions.push({ row, col });
        }
      }
    }

    if (availableCheckerboardPositions.length > 0) {
      return RandomUtils.randomChoice(availableCheckerboardPositions);
    }

    return null;
  }

  /**
   * Генерирует случайный ход
   * @returns {{row: number, col: number}} координаты атаки
   * @private
   */
  #generateRandomMove() {
    return {
      row: RandomUtils.randomInt(0, this.#boardSize),
      col: RandomUtils.randomInt(0, this.#boardSize)
    };
  }

  /**
   * Генерирует резервный ход когда другие методы не работают
   * @returns {{row: number, col: number} | null} координаты атаки
   * @private
   */
  #generateFallbackMove() {
    for (let row = 0; row < this.#boardSize; row++) {
      for (let col = 0; col < this.#boardSize; col++) {
        if (!this.#isPositionAttacked(row, col)) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Обрабатывает результат атаки
   * @param {number} row - строка атаки
   * @param {number} col - столбец атаки
   * @param {boolean} hit - было ли попадание
   * @param {boolean} sunk - был ли потоплен корабль
   */
  processAttackResult(row, col, hit, sunk) {
    if (hit) {
      this.#lastHitPosition = { row, col };
      this.#hitStreak.push({ row, col });

      if (sunk) {
        this.#onShipSunk();
      } else {
        this.#onShipHit(row, col);
      }
    } else {
      this.#onMiss();
    }
  }

  /**
   * Обрабатывает потопление корабля
   * @private
   */
  #onShipSunk() {
    this.#switchToHuntMode();
    this.#hitStreak = [];
    this.#lastHitPosition = null;
  }

  /**
   * Обрабатывает попадание в корабль
   * @param {number} row - строка попадания
   * @param {number} col - столбец попадания
   * @private
   */
  #onShipHit(row, col) {
    this.#switchToTargetMode();
    this.#addAdjacentTargets(row, col);
    
    // Если у нас есть история попаданий, пытаемся определить направление
    if (this.#hitStreak.length > 1) {
      this.#optimizeTargetQueue();
    }
  }

  /**
   * Обрабатывает промах
   * @private
   */
  #onMiss() {
    // Если в режиме цели и очередь пуста, переключаемся в режим охоты
    if (this.#mode === AI_MODES.TARGET && this.#targetQueue.length === 0) {
      this.#switchToHuntMode();
    }
  }

  /**
   * Переключает ИИ в режим охоты
   * @private
   */
  #switchToHuntMode() {
    this.#mode = AI_MODES.HUNT;
    this.#targetQueue = [];
  }

  /**
   * Переключает ИИ в режим целенаправленной атаки
   * @private
   */
  #switchToTargetMode() {
    this.#mode = AI_MODES.TARGET;
  }

  /**
   * Добавляет соседние клетки в очередь целей
   * @param {number} row - строка
   * @param {number} col - столбец
   * @private
   */
  #addAdjacentTargets(row, col) {
    const adjacentPositions = CoordinateUtils.getAdjacentCoordinates(row, col);
    
    adjacentPositions.forEach(({ row: adjRow, col: adjCol }) => {
      const targetKey = CoordinateUtils.coordinatesToString(adjRow, adjCol);
      
      if (!this.#isPositionAttacked(adjRow, adjCol) && 
          !this.#targetQueue.includes(targetKey)) {
        this.#targetQueue.push(targetKey);
      }
    });
  }

  /**
   * Оптимизирует очередь целей на основе предыдущих попаданий
   * @private
   */
  #optimizeTargetQueue() {
    if (this.#hitStreak.length < 2) return;

    // Определяем направление на основе последних двух попаданий
    const lastTwo = this.#hitStreak.slice(-2);
    const [prev, current] = lastTwo;

    const isHorizontal = prev.row === current.row;
    const isVertical = prev.col === current.col;

    if (isHorizontal || isVertical) {
      // Приоритизируем цели в том же направлении
      this.#prioritizeDirectionalTargets(prev, current, isHorizontal);
    }
  }

  /**
   * Приоритизирует цели в определенном направлении
   * @param {Object} prev - предыдущее попадание
   * @param {Object} current - текущее попадание
   * @param {boolean} isHorizontal - горизонтальное ли направление
   * @private
   */
  #prioritizeDirectionalTargets(prev, current, isHorizontal) {
    const priorityTargets = [];
    const regularTargets = [];

    // Определяем продолжение линии в обе стороны
    if (isHorizontal) {
      const row = current.row;
      const leftCol = Math.min(prev.col, current.col) - 1;
      const rightCol = Math.max(prev.col, current.col) + 1;

      [leftCol, rightCol].forEach(col => {
        if (CoordinateUtils.isValidCoordinate(row, col) && 
            !this.#isPositionAttacked(row, col)) {
          priorityTargets.push(CoordinateUtils.coordinatesToString(row, col));
        }
      });
    } else {
      const col = current.col;
      const topRow = Math.min(prev.row, current.row) - 1;
      const bottomRow = Math.max(prev.row, current.row) + 1;

      [topRow, bottomRow].forEach(row => {
        if (CoordinateUtils.isValidCoordinate(row, col) && 
            !this.#isPositionAttacked(row, col)) {
          priorityTargets.push(CoordinateUtils.coordinatesToString(row, col));
        }
      });
    }

    // Разделяем существующие цели на приоритетные и обычные
    this.#targetQueue.forEach(target => {
      if (!priorityTargets.includes(target)) {
        regularTargets.push(target);
      }
    });

    // Перестраиваем очередь: приоритетные цели первыми
    this.#targetQueue = [...priorityTargets, ...regularTargets];
  }

  /**
   * Проверяет, была ли атакована позиция
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} была ли атакована позиция
   * @private
   */
  #isPositionAttacked(row, col) {
    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    return this.#attackedPositions.has(positionKey);
  }

  /**
   * Получает текущий режим ИИ
   * @returns {string} текущий режим
   */
  getCurrentMode() {
    return this.#mode;
  }

  /**
   * Получает размер очереди целей
   * @returns {number} размер очереди
   */
  getTargetQueueSize() {
    return this.#targetQueue.length;
  }

  /**
   * Получает отладочную информацию о состоянии ИИ
   * @returns {Object} отладочная информация
   */
  getDebugInfo() {
    return {
      mode: this.#mode,
      targetQueueSize: this.#targetQueue.length,
      attackedPositionsCount: this.#attackedPositions.size,
      hitStreakLength: this.#hitStreak.length,
      lastHitPosition: this.#lastHitPosition
    };
  }
} 