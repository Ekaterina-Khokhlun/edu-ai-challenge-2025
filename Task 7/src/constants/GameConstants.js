/**
 * Константы игры "Морской бой"
 * Централизованное хранение всех игровых настроек
 */

export const GAME_CONFIG = {
  BOARD_SIZE: 10,
  SHIP_COUNT: 3,
  SHIP_LENGTH: 3,
  MAX_PLACEMENT_ATTEMPTS: 1000
};

export const CELL_STATES = {
  WATER: '~',
  SHIP: 'S',
  HIT: 'X',
  MISS: 'O'
};

export const GAME_STATES = {
  INITIALIZING: 'initializing',
  PLACING_SHIPS: 'placing_ships',
  PLAYER_TURN: 'player_turn',
  AI_TURN: 'ai_turn',
  GAME_OVER: 'game_over'
};

export const AI_MODES = {
  HUNT: 'hunt',
  TARGET: 'target'
};

export const SHIP_ORIENTATIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
};

export const PLAYER_TYPES = {
  HUMAN: 'human',
  AI: 'ai'
};

export const GAME_MESSAGES = {
  WELCOME: 'Welcome to Sea Battle!',
  GAME_INITIALIZED: 'Game initialized successfully!',
  SHIPS_PLACED: 'ships placed randomly.',
  ENTER_COORDINATES: 'Enter your guess (e.g., 00): ',
  INVALID_INPUT: 'Input must be exactly two digits (e.g., 00, 34, 98).',
  INVALID_COORDINATES: 'Please enter valid row and column numbers between 0 and',
  ALREADY_GUESSED: 'You already guessed that location!',
  PLAYER_HIT: 'PLAYER HIT!',
  PLAYER_MISS: 'PLAYER MISS.',
  AI_HIT: 'HIT at',
  AI_MISS: 'MISS at',
  SHIP_SUNK: 'Ship sunk!',
  PLAYER_WINS: '*** CONGRATULATIONS! You sunk all enemy battleships! ***',
  AI_WINS: '*** GAME OVER! The CPU sunk all your battleships! ***',
  AI_TURN: "--- CPU's Turn ---"
};

export default {
  GAME_CONFIG,
  CELL_STATES,
  GAME_STATES,
  AI_MODES,
  SHIP_ORIENTATIONS,
  PLAYER_TYPES,
  GAME_MESSAGES
}; 