import { GAME_MESSAGES } from '../constants/GameConstants.js';

/**
 * Класс отвечающий за отображение игры "Морской бой"
 * Реализует паттерн View в архитектуре MVC
 */
export class GameRenderer {
  #boardSize;

  /**
   * Создает новый рендерер игры
   * @param {number} boardSize - размер игрового поля
   */
  constructor(boardSize) {
    this.#boardSize = boardSize;
  }

  /**
   * Отображает приветственное сообщение
   */
  displayWelcomeMessage() {
    console.log(GAME_MESSAGES.WELCOME);
    console.log('='.repeat(GAME_MESSAGES.WELCOME.length) + '\n');
  }

  /**
   * Отображает сообщение об инициализации игры
   */
  displayInitializationMessage() {
    console.log('Initializing Sea Battle game...');
  }

  /**
   * Отображает сообщение о размещении кораблей
   * @param {number} count - количество размещенных кораблей
   */
  displayShipsPlaced(count) {
    console.log(`${count} ${GAME_MESSAGES.SHIPS_PLACED}`);
  }

  /**
   * Отображает сообщение об успешной инициализации
   * @param {number} shipCount - количество кораблей
   */
  displayGameInitialized(shipCount) {
    console.log(`\n${GAME_MESSAGES.GAME_INITIALIZED}`);
    console.log(`Try to sink the ${shipCount} enemy ships.`);
  }

  /**
   * Отображает игровые поля
   * @param {Array} playerBoard - поле игрока
   * @param {Array} opponentBoard - поле противника (видимая часть)
   */
  displayBoards(playerBoard, opponentBoard) {
    console.log('\n   --- OPPONENT BOARD ---          --- YOUR BOARD ---');
    
    const header = this.#generateBoardHeader();
    console.log(header + '     ' + header);

    for (let row = 0; row < this.#boardSize; row++) {
      const rowDisplay = this.#generateRowDisplay(row, playerBoard, opponentBoard);
      console.log(rowDisplay);
    }
    
    console.log('');
  }

  /**
   * Генерирует заголовок для поля
   * @returns {string} строка заголовка
   * @private
   */
  #generateBoardHeader() {
    let header = '  ';
    for (let col = 0; col < this.#boardSize; col++) {
      header += col + ' ';
    }
    return header;
  }

  /**
   * Генерирует отображение строки для обоих полей
   * @param {number} row - номер строки
   * @param {Array} playerBoard - поле игрока
   * @param {Array} opponentBoard - поле противника
   * @returns {string} строка для отображения
   * @private
   */
  #generateRowDisplay(row, playerBoard, opponentBoard) {
    let rowDisplay = row + ' ';

    // Поле противника
    for (let col = 0; col < this.#boardSize; col++) {
      rowDisplay += opponentBoard[row][col] + ' ';
    }

    rowDisplay += '    ' + row + ' ';

    // Поле игрока
    for (let col = 0; col < this.#boardSize; col++) {
      rowDisplay += playerBoard[row][col] + ' ';
    }

    return rowDisplay;
  }

  /**
   * Отображает запрос на ввод координат
   */
  displayCoordinatePrompt() {
    return GAME_MESSAGES.ENTER_COORDINATES;
  }

  /**
   * Отображает сообщение об ошибке валидации
   * @param {string} message - сообщение об ошибке
   */
  displayValidationError(message) {
    console.log(message);
  }

  /**
   * Отображает результат атаки игрока
   * @param {Object} result - результат атаки
   */
  displayPlayerAttackResult(result) {
    if (result.hit) {
      console.log(GAME_MESSAGES.PLAYER_HIT);
      if (result.sunk) {
        console.log('You sunk an enemy battleship!');
      }
    } else {
      console.log(GAME_MESSAGES.PLAYER_MISS);
    }
  }

  /**
   * Отображает начало хода ИИ
   */
  displayAITurnStart() {
    console.log(`\n${GAME_MESSAGES.AI_TURN}`);
  }

  /**
   * Отображает результат атаки ИИ
   * @param {string} coordinates - координаты атаки
   * @param {Object} result - результат атаки
   * @param {string} aiName - имя ИИ
   */
  displayAIAttackResult(coordinates, result, aiName = 'CPU') {
    if (result.hit) {
      console.log(`${aiName} ${GAME_MESSAGES.AI_HIT} ${coordinates}!`);
      if (result.sunk) {
        console.log(`${aiName} sunk your battleship!`);
      }
    } else {
      console.log(`${aiName} ${GAME_MESSAGES.AI_MISS} ${coordinates}.`);
    }
  }

  /**
   * Отображает сообщение о победе игрока
   */
  displayPlayerVictory() {
    console.log(`\n${GAME_MESSAGES.PLAYER_WINS}`);
  }

  /**
   * Отображает сообщение о победе ИИ
   */
  displayAIVictory() {
    console.log(`\n${GAME_MESSAGES.AI_WINS}`);
  }

  /**
   * Отображает сообщение об ошибке
   * @param {string} message - сообщение об ошибке
   */
  displayError(message) {
    console.error(`Error: ${message}`);
  }

  /**
   * Отображает отладочную информацию (только в режиме разработки)
   * @param {Object} debugInfo - отладочная информация
   */
  displayDebugInfo(debugInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n--- DEBUG INFO ---');
      console.log(JSON.stringify(debugInfo, null, 2));
      console.log('--- END DEBUG ---\n');
    }
  }

  /**
   * Отображает статистику игры
   * @param {Object} stats - статистика игры
   */
  displayGameStats(stats) {
    console.log('\n--- GAME STATISTICS ---');
    console.log(`Total moves: ${stats.totalMoves || 'N/A'}`);
    console.log(`Player hits: ${stats.playerHits || 'N/A'}`);
    console.log(`AI hits: ${stats.aiHits || 'N/A'}`);
    console.log(`Game duration: ${stats.duration || 'N/A'}`);
    console.log('--- END STATISTICS ---\n');
  }

  /**
   * Очищает консоль (в зависимости от платформы)
   */
  clearScreen() {
    // В Node.js очистка консоли зависит от операционной системы
    if (process.platform === 'win32') {
      console.clear();
    } else {
      process.stdout.write('\x1Bc');
    }
  }

  /**
   * Отображает прогресс загрузки
   * @param {number} percentage - процент завершения (0-100)
   * @param {string} message - сообщение
   */
  displayProgress(percentage, message) {
    const barLength = 20;
    const filledLength = Math.round(barLength * percentage / 100);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    console.log(`${message}: [${bar}] ${percentage}%`);
  }

  /**
   * Отображает таблицу результатов
   * @param {Array} data - данные для таблицы
   * @param {Array} headers - заголовки столбцов
   */
  displayTable(data, headers) {
    console.log('\n' + headers.join(' | '));
    console.log('-'.repeat(headers.join(' | ').length));
    
    data.forEach(row => {
      console.log(row.join(' | '));
    });
    
    console.log('');
  }
} 