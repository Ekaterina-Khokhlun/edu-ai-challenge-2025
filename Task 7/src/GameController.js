import { Player } from './models/Player.js';
import { GameRenderer } from './views/GameRenderer.js';
import { InputHandler } from './InputHandler.js';
import { GAME_CONFIG, GAME_STATES, PLAYER_TYPES } from './constants/GameConstants.js';
import { CoordinateUtils } from './utils/GameUtils.js';

/**
 * Основной контроллер игры "Морской бой"
 * Реализует паттерн MVC, координируя взаимодействие между моделями и представлениями
 */
export class GameController {
  #gameState;
  #humanPlayer;
  #aiPlayer;
  #currentPlayer;
  #renderer;
  #inputHandler;
  #gameConfig;
  #gameStatistics;
  #startTime;

  /**
   * Создает новый контроллер игры
   * @param {Object} config - конфигурация игры
   */
  constructor(config = {}) {
    this.#gameConfig = { ...GAME_CONFIG, ...config };
    this.#gameState = GAME_STATES.INITIALIZING;
    this.#renderer = new GameRenderer(this.#gameConfig.BOARD_SIZE);
    this.#inputHandler = new InputHandler();
    this.#gameStatistics = this.#initializeGameStatistics();
    
    this.#initializePlayers();
  }

  /**
   * Инициализирует игроков
   * @private
   */
  #initializePlayers() {
    this.#humanPlayer = new Player(
      'Player', 
      PLAYER_TYPES.HUMAN, 
      this.#gameConfig.BOARD_SIZE
    );
    
    this.#aiPlayer = new Player(
      'CPU', 
      PLAYER_TYPES.AI, 
      this.#gameConfig.BOARD_SIZE
    );
    
    this.#currentPlayer = this.#humanPlayer;
  }

  /**
   * Инициализирует статистику игры
   * @returns {Object} объект статистики
   * @private
   */
  #initializeGameStatistics() {
    return {
      totalMoves: 0,
      playerMoves: 0,
      aiMoves: 0,
      gameStartTime: null,
      gameEndTime: null,
      winner: null
    };
  }

  /**
   * Запускает игру
   */
  async start() {
    try {
      this.#startTime = Date.now();
      this.#gameStatistics.gameStartTime = new Date().toISOString();
      
      this.#renderer.displayWelcomeMessage();
      await this.#initializeGame();
      await this.#runGameLoop();
      
    } catch (error) {
      this.#renderer.displayError(error.message);
      this.#handleGameError(error);
    } finally {
      this.#cleanup();
    }
  }

  /**
   * Инициализирует игру
   * @private
   */
  async #initializeGame() {
    this.#gameState = GAME_STATES.PLACING_SHIPS;
    this.#renderer.displayInitializationMessage();

    // Размещаем корабли для обоих игроков
    const humanShipsPlaced = await this.#humanPlayer.placeShips(
      this.#gameConfig.SHIP_COUNT, 
      this.#gameConfig.SHIP_LENGTH
    );
    
    const aiShipsPlaced = await this.#aiPlayer.placeShips(
      this.#gameConfig.SHIP_COUNT, 
      this.#gameConfig.SHIP_LENGTH
    );

    if (!humanShipsPlaced || !aiShipsPlaced) {
      throw new Error('Failed to place ships for one or both players');
    }

    this.#renderer.displayShipsPlaced(this.#gameConfig.SHIP_COUNT);
    this.#renderer.displayGameInitialized(this.#gameConfig.SHIP_COUNT);
    
    this.#gameState = GAME_STATES.PLAYER_TURN;
  }

  /**
   * Основной игровой цикл
   * @private
   */
  async #runGameLoop() {
    while (!this.#isGameOver()) {
      try {
        if (this.#currentPlayer === this.#humanPlayer) {
          await this.#processHumanTurn();
        } else {
          await this.#processAITurn();
        }
        
        this.#switchCurrentPlayer();
        
      } catch (error) {
        this.#renderer.displayError(`Turn error: ${error.message}`);
        // Продолжаем игру, если ошибка не критическая
      }
    }

    this.#finishGame();
  }

  /**
   * Обрабатывает ход человека
   * @private
   */
  async #processHumanTurn() {
    this.#gameState = GAME_STATES.PLAYER_TURN;
    
    // Отображаем текущее состояние полей
    this.#displayGameState();
    
    let validMove = false;
    let attackResult;

    while (!validMove) {
      try {
        const input = await this.#inputHandler.question(
          this.#renderer.displayCoordinatePrompt()
        );
        
        const validation = this.#humanPlayer.validateHumanMove(input);
        
        if (!validation.isValid) {
          this.#renderer.displayValidationError(validation.message);
          continue;
        }

        const { row, col } = validation.coordinates;
        attackResult = await this.#humanPlayer.performAttack(row, col, this.#aiPlayer);
        
        // Обновляем представление игрока о поле противника
        this.#updatePlayerOpponentView(this.#humanPlayer, row, col, attackResult);
        
        this.#renderer.displayPlayerAttackResult(attackResult);
        this.#gameStatistics.playerMoves++;
        this.#gameStatistics.totalMoves++;
        
        validMove = true;
        
      } catch (error) {
        this.#renderer.displayError(`Invalid move: ${error.message}`);
      }
    }

    return attackResult;
  }

  /**
   * Обрабатывает ход ИИ
   * @private
   */
  async #processAITurn() {
    this.#gameState = GAME_STATES.AI_TURN;
    this.#renderer.displayAITurnStart();

    try {
      const aiMove = await this.#aiPlayer.generateMove();
      
      if (!aiMove) {
        throw new Error('AI could not generate a valid move');
      }

      const { row, col } = aiMove;
      const coordinates = CoordinateUtils.coordinatesToString(row, col);
      
      const attackResult = await this.#aiPlayer.performAttack(row, col, this.#humanPlayer);
      
      // Обновляем представление ИИ о поле противника
      this.#updatePlayerOpponentView(this.#aiPlayer, row, col, attackResult);
      
      this.#renderer.displayAIAttackResult(coordinates, attackResult, this.#aiPlayer.getName());
      this.#gameStatistics.aiMoves++;
      this.#gameStatistics.totalMoves++;
      
      return attackResult;
      
    } catch (error) {
      this.#renderer.displayError(`AI turn error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Обновляет представление игрока о поле противника
   * @param {Player} player - игрок
   * @param {number} row - строка
   * @param {number} col - столбец
   * @param {Object} result - результат атаки
   * @private
   */
  #updatePlayerOpponentView(player, row, col, result) {
    const opponentBoard = player.getOpponentBoard();
    const cellState = result.hit ? 'X' : 'O';
    
    // Обновляем сетку представления о поле противника
    const grid = opponentBoard.getGrid();
    grid[row][col] = cellState;
  }

  /**
   * Отображает текущее состояние игры
   * @private
   */
  #displayGameState() {
    const humanBoard = this.#humanPlayer.getOwnBoard().getGrid();
    const opponentView = this.#humanPlayer.getOpponentBoard().getGrid();
    
    this.#renderer.displayBoards(humanBoard, opponentView);
  }

  /**
   * Переключает текущего игрока
   * @private
   */
  #switchCurrentPlayer() {
    this.#currentPlayer = this.#currentPlayer === this.#humanPlayer 
      ? this.#aiPlayer 
      : this.#humanPlayer;
  }

  /**
   * Проверяет, окончена ли игра
   * @returns {boolean} окончена ли игра
   * @private
   */
  #isGameOver() {
    return !this.#humanPlayer.hasRemainingShips() || !this.#aiPlayer.hasRemainingShips();
  }

  /**
   * Завершает игру и отображает результаты
   * @private
   */
  #finishGame() {
    this.#gameState = GAME_STATES.GAME_OVER;
    this.#gameStatistics.gameEndTime = new Date().toISOString();
    
    // Определяем победителя
    if (!this.#aiPlayer.hasRemainingShips()) {
      this.#gameStatistics.winner = this.#humanPlayer.getName();
      this.#renderer.displayPlayerVictory();
    } else {
      this.#gameStatistics.winner = this.#aiPlayer.getName();
      this.#renderer.displayAIVictory();
    }

    // Отображаем финальное состояние
    this.#displayGameState();
    
    // Показываем статистику (опционально)
    this.#displayFinalStatistics();
  }

  /**
   * Отображает финальную статистику
   * @private
   */
  #displayFinalStatistics() {
    const duration = this.#startTime ? 
      Math.round((Date.now() - this.#startTime) / 1000) : 'N/A';
    
    const stats = {
      totalMoves: this.#gameStatistics.totalMoves,
      playerMoves: this.#gameStatistics.playerMoves,
      aiMoves: this.#gameStatistics.aiMoves,
      duration: `${duration}s`,
      winner: this.#gameStatistics.winner,
      playerStats: this.#humanPlayer.getStatistics(),
      aiStats: this.#aiPlayer.getStatistics()
    };

    this.#renderer.displayGameStats(stats);
  }

  /**
   * Обрабатывает ошибки игры
   * @param {Error} error - ошибка
   * @private
   */
  #handleGameError(error) {
    console.error('Game error:', error);
    this.#gameState = GAME_STATES.GAME_OVER;
    
    // Логирование для отладки
    const debugInfo = {
      error: error.message,
      gameState: this.#gameState,
      currentPlayer: this.#currentPlayer?.getName(),
      statistics: this.#gameStatistics
    };
    
    this.#renderer.displayDebugInfo(debugInfo);
  }

  /**
   * Очищает ресурсы
   * @private
   */
  #cleanup() {
    if (this.#inputHandler) {
      this.#inputHandler.close();
    }
  }

  /**
   * Получает текущее состояние игры
   * @returns {string} состояние игры
   */
  getCurrentState() {
    return this.#gameState;
  }

  /**
   * Получает статистику игры
   * @returns {Object} статистика игры
   */
  getGameStatistics() {
    return { ...this.#gameStatistics };
  }

  /**
   * Получает информацию об игроках
   * @returns {Object} информация об игроках
   */
  getPlayersInfo() {
    return {
      human: this.#humanPlayer.getDebugInfo(),
      ai: this.#aiPlayer.getDebugInfo()
    };
  }

  /**
   * Перезапускает игру
   */
  async restart() {
    this.#gameState = GAME_STATES.INITIALIZING;
    this.#gameStatistics = this.#initializeGameStatistics();
    this.#startTime = null;
    
    this.#humanPlayer.reset();
    this.#aiPlayer.reset();
    this.#currentPlayer = this.#humanPlayer;
    
    await this.start();
  }
} 