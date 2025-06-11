import { GAME_CONFIG } from '../constants/GameConstants.js';
import { CoordinateUtils } from '../utils/GameUtils.js';

/**
 * Класс представляющий корабль в игре "Морской бой"
 * Инкапсулирует состояние и поведение отдельного корабля
 */
export class Ship {
  #length;
  #positions;
  #hitPositions;
  #isSunk;

  /**
   * Создает новый корабль
   * @param {number} length - длина корабля
   */
  constructor(length = GAME_CONFIG.SHIP_LENGTH) {
    this.#length = length;
    this.#positions = [];
    this.#hitPositions = new Set();
    this.#isSunk = false;

    this.#validateLength(length);
  }

  /**
   * Валидирует длину корабля
   * @param {number} length - длина корабля
   * @private
   */
  #validateLength(length) {
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error('Ship length must be a positive integer');
    }
  }

  /**
   * Добавляет позицию к кораблю
   * @param {number} row - строка
   * @param {number} col - столбец
   * @throws {Error} если позиция невалидна или корабль уже заполнен
   */
  addPosition(row, col) {
    if (this.#positions.length >= this.#length) {
      throw new Error('Ship is already fully positioned');
    }

    if (!CoordinateUtils.isValidCoordinate(row, col)) {
      throw new Error('Invalid coordinates provided');
    }

    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    
    if (this.hasPosition(row, col)) {
      throw new Error('Position already exists on this ship');
    }

    this.#positions.push({ row, col, key: positionKey });
  }

  /**
   * Проверяет, содержит ли корабль указанную позицию
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} содержит ли корабль позицию
   */
  hasPosition(row, col) {
    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    return this.#positions.some(pos => pos.key === positionKey);
  }

  /**
   * Пытается попасть в корабль по указанным координатам
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} было ли попадание
   */
  receiveHit(row, col) {
    if (!this.hasPosition(row, col)) {
      return false;
    }

    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    
    if (this.#hitPositions.has(positionKey)) {
      return false; // уже попадали в эту позицию
    }

    this.#hitPositions.add(positionKey);
    this.#updateSunkStatus();
    
    return true;
  }

  /**
   * Обновляет статус потопления корабля
   * @private
   */
  #updateSunkStatus() {
    this.#isSunk = this.#hitPositions.size === this.#length;
  }

  /**
   * Проверяет, потоплен ли корабль
   * @returns {boolean} потоплен ли корабль
   */
  isSunk() {
    return this.#isSunk;
  }

  /**
   * Проверяет, попадали ли уже в указанную позицию
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} попадали ли в позицию
   */
  isPositionHit(row, col) {
    const positionKey = CoordinateUtils.coordinatesToString(row, col);
    return this.#hitPositions.has(positionKey);
  }

  /**
   * Возвращает длину корабля
   * @returns {number} длина корабля
   */
  getLength() {
    return this.#length;
  }

  /**
   * Возвращает все позиции корабля
   * @returns {Array} массив позиций корабля
   */
  getPositions() {
    return [...this.#positions]; // возвращаем копию для защиты от изменений
  }

  /**
   * Возвращает количество попаданий
   * @returns {number} количество попаданий
   */
  getHitCount() {
    return this.#hitPositions.size;
  }

  /**
   * Проверяет, полностью ли размещен корабль
   * @returns {boolean} размещен ли корабль полностью
   */
  isFullyPositioned() {
    return this.#positions.length === this.#length;
  }

  /**
   * Возвращает информацию о состоянии корабля для отладки
   * @returns {Object} информация о корабле
   */
  getDebugInfo() {
    return {
      length: this.#length,
      positionsCount: this.#positions.length,
      hitCount: this.#hitPositions.size,
      isSunk: this.#isSunk,
      positions: this.getPositions()
    };
  }
} 