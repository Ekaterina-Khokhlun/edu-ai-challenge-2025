import Board from './Board.js';

class Player {
  constructor(name, isAI = false, boardSize = 10) {
    this.name = name;
    this.isAI = isAI;
    this.board = new Board(boardSize);
    this.opponentBoard = new Board(boardSize);
    this.guesses = new Set();
    
    // AI-specific properties
    if (isAI) {
      this.mode = 'hunt';
      this.targetQueue = [];
    }
  }

  async makeGuess() {
    if (this.isAI) {
      return this.makeAIGuess();
    } else {
      // For human players, this will be handled by the Game class
      throw new Error('Human player guesses should be handled externally');
    }
  }

  makeAIGuess() {
    return new Promise((resolve) => {
      let guessRow, guessCol, guessStr;
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        attempts++;

        if (this.mode === 'target' && this.targetQueue.length > 0) {
          guessStr = this.targetQueue.shift();
          guessRow = parseInt(guessStr[0]);
          guessCol = parseInt(guessStr[1]);

          if (this.guesses.has(guessStr)) {
            if (this.targetQueue.length === 0) {
              this.mode = 'hunt';
            }
            continue;
          }
        } else {
          this.mode = 'hunt';
          guessRow = Math.floor(Math.random() * this.board.size);
          guessCol = Math.floor(Math.random() * this.board.size);
          guessStr = `${guessRow}${guessCol}`;

          if (this.guesses.has(guessStr) || 
              !this.opponentBoard.isValidCoordinate(guessRow, guessCol)) {
            continue;
          }
        }

        this.guesses.add(guessStr);
        resolve({ row: guessRow, col: guessCol, guess: guessStr });
        return;
      }

      // Fallback if we can't find a valid guess
      resolve(null);
    });
  }

  processGuessResult(guess, result) {
    if (!this.isAI) return;

    const { row, col } = this.parseGuess(guess);
    
    if (result.hit) {
      this.opponentBoard.grid[row][col] = 'X';
      console.log(`${this.name} HIT at ${guess}!`);

      if (result.sunk) {
        console.log(`${this.name} sunk a battleship!`);
        this.mode = 'hunt';
        this.targetQueue = [];
      } else {
        this.mode = 'target';
        this.addAdjacentTargets(row, col);
      }
    } else {
      this.opponentBoard.grid[row][col] = 'O';
      console.log(`${this.name} MISS at ${guess}.`);

      if (this.mode === 'target' && this.targetQueue.length === 0) {
        this.mode = 'hunt';
      }
    }
  }

  addAdjacentTargets(row, col) {
    const adjacent = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 }
    ];

    for (const { r, c } of adjacent) {
      if (this.opponentBoard.isValidCoordinate(r, c)) {
        const adjStr = `${r}${c}`;
        if (!this.guesses.has(adjStr) && !this.targetQueue.includes(adjStr)) {
          this.targetQueue.push(adjStr);
        }
      }
    }
  }

  parseGuess(guess) {
    return {
      row: parseInt(guess[0]),
      col: parseInt(guess[1])
    };
  }

  isValidGuess(guess) {
    if (!guess || guess.length !== 2) {
      return { valid: false, message: 'Input must be exactly two digits (e.g., 00, 34, 98).' };
    }

    const { row, col } = this.parseGuess(guess);

    if (isNaN(row) || isNaN(col) || 
        !this.opponentBoard.isValidCoordinate(row, col)) {
      return { 
        valid: false, 
        message: `Please enter valid row and column numbers between 0 and ${this.board.size - 1}.` 
      };
    }

    if (this.guesses.has(guess)) {
      return { valid: false, message: 'You already guessed that location!' };
    }

    return { valid: true };
  }

  placeShips(numberOfShips, shipLength) {
    return this.board.placeShipsRandomly(numberOfShips, shipLength);
  }

  receiveAttack(guess) {
    return this.board.processGuess(guess);
  }

  hasShipsRemaining() {
    return !this.board.getAllShipsSunk();
  }

  getShipsCount() {
    return this.board.getShipsCount();
  }
}

export default Player; 