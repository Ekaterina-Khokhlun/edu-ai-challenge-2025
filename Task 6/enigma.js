const readline = require('readline');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function mod(n, m) {
  return ((n % m) + m) % m;
}

const ROTORS = [
  { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' }, // Rotor I
  { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' }, // Rotor II
  { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' }, // Rotor III
];
const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

function plugboardSwap(c, pairs) {
  for (const [a, b] of pairs) {
    if (c === a) return b;
    if (c === b) return a;
  }
  return c;
}

class Rotor {
  constructor(wiring, notch, ringSetting = 0, position = 0) {
    this.wiring = wiring;
    this.notch = notch;
    this.ringSetting = ringSetting;
    this.position = position;
  }
  step() {
    this.position = mod(this.position + 1, 26);
  }
  atNotch() {
    return alphabet[this.position] === this.notch;
  }
  forward(c) {
    const idx = mod(alphabet.indexOf(c) + this.position - this.ringSetting, 26);
    return this.wiring[idx];
  }
  backward(c) {
    const idx = this.wiring.indexOf(c);
    return alphabet[mod(idx - this.position + this.ringSetting, 26)];
  }
}

class Enigma {
  constructor(rotorIDs, rotorPositions, ringSettings, plugboardPairs) {
    // Валидация входных данных
    if (!Array.isArray(rotorIDs) || rotorIDs.length !== 3) {
      throw new Error('Rotor IDs must be an array of 3 elements');
    }
    if (!Array.isArray(rotorPositions) || rotorPositions.length !== 3) {
      throw new Error('Rotor positions must be an array of 3 elements');
    }
    if (!Array.isArray(ringSettings) || ringSettings.length !== 3) {
      throw new Error('Ring settings must be an array of 3 elements');
    }
    
    // Проверка корректности позиций роторов
    if (rotorPositions.some(pos => pos < 0 || pos > 25 || !Number.isInteger(pos))) {
      throw new Error('Rotor positions must be integers between 0 and 25');
    }
    
    // Проверка корректности ring settings
    if (ringSettings.some(setting => setting < 0 || setting > 25 || !Number.isInteger(setting))) {
      throw new Error('Ring settings must be integers between 0 and 25');
    }
    
    // Проверка корректности rotor IDs
    if (rotorIDs.some(id => id < 0 || id >= ROTORS.length || !Number.isInteger(id))) {
      throw new Error(`Rotor IDs must be integers between 0 and ${ROTORS.length - 1}`);
    }
    
    // Проверка plugboard пар
    if (!Array.isArray(plugboardPairs)) {
      throw new Error('Plugboard pairs must be an array');
    }
    
    const usedLetters = new Set();
    for (const [a, b] of plugboardPairs) {
      if (typeof a !== 'string' || typeof b !== 'string' || 
          a.length !== 1 || b.length !== 1 ||
          !alphabet.includes(a) || !alphabet.includes(b)) {
        throw new Error('Plugboard pairs must contain valid single letters');
      }
      if (a === b) {
        throw new Error('Plugboard pairs cannot connect a letter to itself');
      }
      if (usedLetters.has(a) || usedLetters.has(b)) {
        throw new Error('Each letter can only be used once in plugboard pairs');
      }
      usedLetters.add(a);
      usedLetters.add(b);
    }

    this.rotors = rotorIDs.map(
      (id, i) =>
        new Rotor(
          ROTORS[id].wiring,
          ROTORS[id].notch,
          ringSettings[i],
          rotorPositions[i],
        ),
    );
    this.plugboardPairs = plugboardPairs;
  }
  
  stepRotors() {
    // Правильная реализация double-stepping механизма
    const middleAtNotch = this.rotors[1].atNotch();
    const rightAtNotch = this.rotors[2].atNotch();
    
    // Если средний ротор на зарубке, то левый и средний поворачиваются (double-step)
    if (middleAtNotch) {
      this.rotors[0].step();
      this.rotors[1].step();
    }
    
    // Если правый ротор на зарубке, средний поворачивается
    if (rightAtNotch) {
      this.rotors[1].step();
    }
    
    // Правый ротор всегда поворачивается
    this.rotors[2].step();
  }
  
  encryptChar(c) {
    if (!alphabet.includes(c)) return c;
    
    this.stepRotors();
    
    // Первое plugboard преобразование
    c = plugboardSwap(c, this.plugboardPairs);
    
    // Прохождение через роторы (справа налево)
    for (let i = this.rotors.length - 1; i >= 0; i--) {
      c = this.rotors[i].forward(c);
    }

    // Рефлектор
    c = REFLECTOR[alphabet.indexOf(c)];

    // Обратное прохождение через роторы (слева направо)
    for (let i = 0; i < this.rotors.length; i++) {
      c = this.rotors[i].backward(c);
    }

    // Второе plugboard преобразование
    return plugboardSwap(c, this.plugboardPairs);
  }
  
  process(text) {
    return text
      .toUpperCase()
      .split('')
      .map((c) => this.encryptChar(c))
      .join('');
  }
}

function promptEnigma() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  rl.question('Enter message: ', (message) => {
    rl.question('Rotor positions (e.g. 0 0 0): ', (posStr) => {
      try {
        const rotorPositions = posStr.split(' ').map(Number);
        if (rotorPositions.length !== 3 || rotorPositions.some(isNaN)) {
          throw new Error('Please enter exactly 3 numbers separated by spaces');
        }
        
        rl.question('Ring settings (e.g. 0 0 0): ', (ringStr) => {
          try {
            const ringSettings = ringStr.split(' ').map(Number);
            if (ringSettings.length !== 3 || ringSettings.some(isNaN)) {
              throw new Error('Please enter exactly 3 numbers separated by spaces');
            }
            
            rl.question('Plugboard pairs (e.g. AB CD): ', (plugStr) => {
              try {
                const plugPairs =
                  plugStr.trim() === '' ? [] :
                  plugStr
                    .toUpperCase()
                    .match(/([A-Z]{2})/g)
                    ?.map((pair) => [pair[0], pair[1]]) || [];

                const enigma = new Enigma(
                  [0, 1, 2],
                  rotorPositions,
                  ringSettings,
                  plugPairs,
                );
                
                const result = enigma.process(message);
                console.log('Output:', result);
              } catch (error) {
                console.error('Error:', error.message);
              } finally {
                rl.close();
              }
            });
          } catch (error) {
            console.error('Error:', error.message);
            rl.close();
          }
        });
      } catch (error) {
        console.error('Error:', error.message);
        rl.close();
      }
    });
  });
}

if (require.main === module) {
  promptEnigma();
}
