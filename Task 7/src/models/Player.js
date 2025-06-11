import { Board } from './Board.js';
import { AIStrategy } from '../strategies/AIStrategy.js';
import { PLAYER_TYPES, GAME_CONFIG } from '../constants/GameConstants.js';
import { CoordinateUtils, ValidationUtils } from '../utils/GameUtils.js';

/**
 * Класс представляющий игрока в игре "Морской бой"
 * Инкапсулирует состояние и поведение как человека, так и ИИ
 */
export class Player {
  #name;
  #type;
  #ownBoard;
  #opponentBoard;
  #aiStrategy;
  #statistics;

  /**
   * Создает нового игрока
   * @param {string} name - имя игрока
   * @param {string} type - тип игрока (human/ai)
   * @param {number} boardSize - размер игрового поля
   */
  constructor(name, type = PLAYER_TYPES.HUMAN, boardSize = GAME_CONFIG.BOARD_SIZE) {
    this.#name = name;
    this.#type = type;
    this.#ownBoard = new Board(boardSize);
    this.#opponentBoard = new Board(boardSize);
    this.#statistics = this.#initializeStatistics();

    // Инициализируем стратегию ИИ только для ИИ игроков
    if (this.#type === PLAYER_TYPES.AI) {
      this.#aiStrategy = new AIStrategy(boardSize);
    }

    this.#validatePlayerData(name, type);
  }

  /**
   * Валидирует данные игрока
   * @param {string} name - имя игрока
   * @param {string} type - тип игрока
   * @private
   */
  #validatePlayerData(name, type) {
    if (!name || typeof name !== 'string') {
      throw new Error('Player name must be a non-empty string');
    }

    if (!Object.values(PLAYER_TYPES).includes(type)) {
      throw new Error('Invalid player type');
    }
  }

  /**
   * Инициализирует статистику игрока
   * @returns {Object} объект статистики
   * @private
   */
  #initializeStatistics() {
    return {
      totalShots: 0,
      hits: 0,
      misses: 0,
      shipsSunk: 0,
      accuracy: 0
    };
  }

  /**
   * Размещает корабли на поле игрока
   * @param {number} shipCount - количество кораблей
   * @param {number} shipLength - длина кораблей
   * @returns {boolean} успешно ли размещены корабли
   */
  async placeShips(shipCount = GAME_CONFIG.SHIP_COUNT, shipLength = GAME_CONFIG.SHIP_LENGTH) {
    const success = this.#ownBoard.placeShipsRandomly(shipCount, shipLength);
    
    if (success && this.#type === PLAYER_TYPES.HUMAN) {
      // Показываем корабли на поле игрока-человека
      this.#ownBoard.revealShips();
    }
    
    return success;
  }

  /**
   * Генерирует ход для игрока
   * @returns {Promise<{row: number, col: number}>} координаты атаки
   */
  async generateMove() {
    if (this.#type === PLAYER_TYPES.AI) {
      if (!this.#aiStrategy) {
        throw new Error('AI strategy not initialized');
      }
      return await this.#aiStrategy.generateMove();
    } else {
      throw new Error('Human players cannot generate moves automatically');
    }
  }

  /**
   * Валидирует ход человека
   * @param {string} input - введенные координаты
   * @returns {Object} результат валидации
   */
  validateHumanMove(input) {
    if (this.#type !== PLAYER_TYPES.HUMAN) {
      throw new Error('Only human players can validate manual input');
    }

    const validation = ValidationUtils.validateCoordinateInput(input);
    if (!validation.isValid) {
      return validation;
    }

    const coordinates = CoordinateUtils.parseCoordinates(input);
    const { row, col } = coordinates;

    // Проверяем, не атаковали ли мы уже эту позицию
    if (this.#opponentBoard.isPositionAttacked(row, col)) {
      return {
        isValid: false,
        message: 'You already attacked this position!'
      };
    }

    return { isValid: true, coordinates };
  }

  /**
   * Выполняет атаку по указанным координатам
   * @param {number} row - строка
   * @param {number} col - столбец
   * @param {Player} opponent - противник
   * @returns {Object} результат атаки
   */
  async performAttack(row, col, opponent) {
    if (!CoordinateUtils.isValidCoordinate(row, col)) {
      throw new Error('Invalid attack coordinates');
    }

    this.#updateStatistics('shot');

    // Атакуем поле противника
    const attackResult = opponent.receiveAttack(row, col);

    // Обновляем наш взгляд на поле противника
    this.#updateOpponentBoardView(row, col, attackResult);

    // Обновляем статистику
    this.#updateStatistics(attackResult.hit ? 'hit' : 'miss');
    if (attackResult.sunk) {
      this.#updateStatistics('sunk');
    }

    // Если это ИИ, обновляем стратегию
    if (this.#type === PLAYER_TYPES.AI && this.#aiStrategy) {
      this.#aiStrategy.processAttackResult(row, col, attackResult.hit, attackResult.sunk);
    }

    return attackResult;
  }

  /**
   * Получает атаку от противника
   * @param {number} row - строка
   * @param {number} col - столбец
   * @returns {Object} результат атаки
   */
  receiveAttack(row, col) {
    return this.#ownBoard.receiveAttack(row, col);
  }

  /**
   * Обновляет представление о поле противника
   * @param {number} row - строка
   * @param {number} col - столбец
   * @param {Object} result - результат атаки
   * @private
   */
  #updateOpponentBoardView(row, col, result) {
    const cellState = result.hit ? 'X' : 'O';
    // Обновляем наше представление о поле противника
    this.#opponentBoard.setCellState(row, col, cellState);
  }

  /**
   * Обновляет статистику игрока
   * @param {string} action - тип действия
   * @private
   */
  #updateStatistics(action) {
    switch (action) {
      case 'shot':
        this.#statistics.totalShots++;
        break;
      case 'hit':
        this.#statistics.hits++;
        break;
      case 'miss':
        this.#statistics.misses++;
        break;
      case 'sunk':
        this.#statistics.shipsSunk++;
        break;
    }

    // Пересчитываем точность
    if (this.#statistics.totalShots > 0) {
      this.#statistics.accuracy = 
        Math.round((this.#statistics.hits / this.#statistics.totalShots) * 100);
    }
  }

  /**
   * Проверяет, остались ли у игрока корабли
   * @returns {boolean} есть ли непотопленные корабли
   */
  hasRemainingShips() {
    return !this.#ownBoard.areAllShipsSunk();
  }

  /**
   * Получает количество оставшихся кораблей
   * @returns {number} количество непотопленных кораблей
   */
  getRemainingShipsCount() {
    return this.#ownBoard.getRemainingShipsCount();
  }

  /**
   * Получает имя игрока
   * @returns {string} имя игрока
   */
  getName() {
    return this.#name;
  }

  /**
   * Получает тип игрока
   * @returns {string} тип игрока
   */
  getType() {
    return this.#type;
  }

  /**
   * Проверяет, является ли игрок ИИ
   * @returns {boolean} является ли игрок ИИ
   */
  isAI() {
    return this.#type === PLAYER_TYPES.AI;
  }

  /**
   * Получает собственное игровое поле
   * @returns {Board} собственное поле
   */
  getOwnBoard() {
    return this.#ownBoard;
  }

  /**
   * Получает представление о поле противника
   * @returns {Board} поле противника (ограниченный доступ)
   */
  getOpponentBoard() {
    return this.#opponentBoard;
  }

  /**
   * Получает статистику игрока
   * @returns {Object} статистика игрока
   */
  getStatistics() {
    return { ...this.#statistics }; // возвращаем копию
  }

  /**
   * Получает информацию о стратегии ИИ (только для ИИ игроков)
   * @returns {Object|null} информация о стратегии или null
   */
  getAIStrategyInfo() {
    if (this.#type !== PLAYER_TYPES.AI || !this.#aiStrategy) {
      return null;
    }

    return this.#aiStrategy.getDebugInfo();
  }

  /**
   * Сбрасывает игрока к начальному состоянию
   */
  reset() {
    this.#ownBoard = new Board(this.#ownBoard.getSize());
    this.#opponentBoard = new Board(this.#opponentBoard.getSize());
    this.#statistics = this.#initializeStatistics();

    if (this.#type === PLAYER_TYPES.AI) {
      this.#aiStrategy = new AIStrategy(this.#ownBoard.getSize());
    }
  }

  /**
   * Получает полную отладочную информацию о игроке
   * @returns {Object} отладочная информация
   */
  getDebugInfo() {
    return {
      name: this.#name,
      type: this.#type,
      statistics: this.getStatistics(),
      ownBoard: this.#ownBoard.getDebugInfo(),
      aiStrategy: this.getAIStrategyInfo()
    };
  }
} 