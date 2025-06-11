class Ship {
  constructor(length) {
    this.length = length;
    this.locations = [];
    this.hits = new Array(length).fill(false);
  }

  addLocation(location) {
    this.locations.push(location);
  }

  hit(location) {
    const index = this.locations.indexOf(location);
    if (index >= 0 && !this.hits[index]) {
      this.hits[index] = true;
      return true;
    }
    return false;
  }

  isSunk() {
    return this.hits.every(hit => hit === true);
  }

  isHit(location) {
    const index = this.locations.indexOf(location);
    return index >= 0 && this.hits[index];
  }
}

export default Ship; 