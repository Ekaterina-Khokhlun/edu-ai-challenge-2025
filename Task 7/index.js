import Game from './src/Game.js';
import { GAME_CONFIG } from './src/constants/GameConstants.js';

// Проверяем, запущен ли файл для тестирования
const isTestMode = process.argv.includes('--test');

if (isTestMode) {
  // Запуск тестов
  await import('./test-runner.js');
} else {
  // Обычный запуск игры
  const main = async () => {
    const gameConfig = {
      BOARD_SIZE: 10,
      SHIP_COUNT: 3,
      SHIP_LENGTH: 3
    };
    
    const game = new Game(gameConfig);
    await game.start();
  };

  // Обработка ошибок и graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nGame interrupted. Goodbye!');
    process.exit(0);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Запуск игры
  main().catch((error) => {
    console.error('Failed to start game:', error);
    process.exit(1);
  });
} 