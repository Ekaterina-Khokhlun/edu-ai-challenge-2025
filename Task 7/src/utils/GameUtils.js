import { GAME_CONFIG } from '../constants/GameConstants.js';

/**
 * Утилиты для игры "Морской бой"
 * Содержит общие вспомогательные функции
 */

export class CoordinateUtils {
  /**
   * Проверяет валидность координат
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {boolean} валидны ли координаты
   */
  static isValidCoordinate(row, col) {
    return row >= 0 && row < GAME_CONFIG.BOARD_SIZE && 
           col >= 0 && col < GAME_CONFIG.BOARD_SIZE;
  }

  /**
   * Парсит строку координат в объект
   * @param {string} coordinateString - строка вида "34"
   * @returns {{row: number, col: number} | null} объект координат или null
   */
  static parseCoordinates(coordinateString) {
    if (!coordinateString || coordinateString.length !== 2) {
      return null;
    }

    const row = parseInt(coordinateString[0]);
    const col = parseInt(coordinateString[1]);

    if (isNaN(row) || isNaN(col)) {
      return null;
    }

    return { row, col };
  }

  /**
   * Конвертирует координаты в строку
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {string} строка координат
   */
  static coordinatesToString(row, col) {
    return `${row}${col}`;
  }

  /**
   * Получает соседние координаты
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {Array} массив соседних координат
   */
  static getAdjacentCoordinates(row, col) {
    const adjacent = [
      { row: row - 1, col },
      { row: row + 1, col },
      { row, col: col - 1 },
      { row, col: col + 1 }
    ];

    return adjacent.filter(coord => 
      this.isValidCoordinate(coord.row, coord.col)
    );
  }
}

export class RandomUtils {
  /**
   * Генерирует случайное число в диапазоне
   * @param {number} min - минимальное значение
   * @param {number} max - максимальное значение (не включительно)
   * @returns {number} случайное число
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Возвращает случайный элемент из массива
   * @param {Array} array - массив
   * @returns {*} случайный элемент
   */
  static randomChoice(array) {
    return array[this.randomInt(0, array.length)];
  }

  /**
   * Возвращает случайную ориентацию корабля
   * @returns {string} ориентация корабля
   */
  static randomOrientation() {
    return Math.random() < 0.5 ? 'horizontal' : 'vertical';
  }
}

export class ValidationUtils {
  /**
   * Проверяет валидность строки координат
   * @param {string} input - входная строка
   * @returns {{isValid: boolean, message?: string}} результат валидации
   */
  static validateCoordinateInput(input) {
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        message: 'Input must be exactly two digits (e.g., 00, 34, 98).'
      };
    }

    if (input.length !== 2) {
      return {
        isValid: false,
        message: 'Input must be exactly two digits (e.g., 00, 34, 98).'
      };
    }

    const coordinates = CoordinateUtils.parseCoordinates(input);
    if (!coordinates) {
      return {
        isValid: false,
        message: 'Input must contain only digits.'
      };
    }

    if (!CoordinateUtils.isValidCoordinate(coordinates.row, coordinates.col)) {
      return {
        isValid: false,
        message: `Please enter valid coordinates between 0 and ${GAME_CONFIG.BOARD_SIZE - 1}.`
      };
    }

    return { isValid: true };
  }
}

export class ArrayUtils {
  /**
   * Создает двумерный массив заданного размера
   * @param {number} rows - количество строк
   * @param {number} cols - количество столбцов
   * @param {*} fillValue - значение для заполнения
   * @returns {Array} двумерный массив
   */
  static create2DArray(rows, cols, fillValue) {
    return Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(fillValue));
  }

  /**
   * Глубокое копирование двумерного массива
   * @param {Array} array - исходный массив
   * @returns {Array} копия массива
   */
  static deepCopy2DArray(array) {
    return array.map(row => [...row]);
  }
} 