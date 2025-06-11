import Ship from './Ship.js';

class Board {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.createGrid();
    this.ships = [];
    this.guesses = new Set();
  }

  createGrid() {
    return Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill('~'));
  }

  placeShipsRandomly(numberOfShips, shipLength) {
    let placedShips = 0;
    const maxAttempts = 1000;
    let attempts = 0;

    while (placedShips < numberOfShips && attempts < maxAttempts) {
      attempts++;
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const { startRow, startCol } = this.getRandomStartPosition(shipLength, orientation);
      
      if (this.canPlaceShip(startRow, startCol, shipLength, orientation)) {
        this.placeShip(startRow, startCol, shipLength, orientation);
        placedShips++;
      }
    }

    console.log(`${placedShips} ships placed randomly.`);
    return placedShips === numberOfShips;
  }

  getRandomStartPosition(shipLength, orientation) {
    const startRow = orientation === 'horizontal' 
      ? Math.floor(Math.random() * this.size)
      : Math.floor(Math.random() * (this.size - shipLength + 1));
    
    const startCol = orientation === 'horizontal'
      ? Math.floor(Math.random() * (this.size - shipLength + 1))
      : Math.floor(Math.random() * this.size);

    return { startRow, startCol };
  }

  canPlaceShip(startRow, startCol, shipLength, orientation) {
    for (let i = 0; i < shipLength; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;

      if (row >= this.size || col >= this.size || this.grid[row][col] !== '~') {
        return false;
      }
    }
    return true;
  }

  placeShip(startRow, startCol, shipLength, orientation, showOnGrid = false) {
    const ship = new Ship(shipLength);

    for (let i = 0; i < shipLength; i++) {
      const row = orientation === 'horizontal' ? startRow : startRow + i;
      const col = orientation === 'horizontal' ? startCol + i : startCol;
      const location = `${row}${col}`;
      
      ship.addLocation(location);
      if (showOnGrid) {
        this.grid[row][col] = 'S';
      }
    }

    this.ships.push(ship);
    return ship;
  }

  processGuess(guess) {
    if (this.guesses.has(guess)) {
      return { success: false, message: 'Already guessed this location!' };
    }

    this.guesses.add(guess);
    const row = parseInt(guess[0]);
    const col = parseInt(guess[1]);

    for (const ship of this.ships) {
      if (ship.hit(guess)) {
        this.grid[row][col] = 'X';
        const message = ship.isSunk() ? 'Ship sunk!' : 'Hit!';
        return { success: true, hit: true, sunk: ship.isSunk(), message };
      }
    }

    this.grid[row][col] = 'O';
    return { success: true, hit: false, message: 'Miss!' };
  }

  isValidCoordinate(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  getAllShipsSunk() {
    return this.ships.every(ship => ship.isSunk());
  }

  getShipsCount() {
    return this.ships.filter(ship => !ship.isSunk()).length;
  }

  display() {
    let header = '  ';
    for (let h = 0; h < this.size; h++) {
      header += h + ' ';
    }
    console.log(header);

    for (let i = 0; i < this.size; i++) {
      let rowStr = i + ' ';
      for (let j = 0; j < this.size; j++) {
        rowStr += this.grid[i][j] + ' ';
      }
      console.log(rowStr);
    }
  }
}

export default Board; 