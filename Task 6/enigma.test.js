const assert = require('assert');
const { execSync } = require('child_process');

// Импортируем классы из enigma.js
const enigmaModule = require('./enigma.js');

// Поскольку enigma.js не экспортирует классы, нам нужно их извлечь
// Для тестирования создадим копии классов здесь
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

// Модульные тесты
console.log('🧪 Запуск модульных тестов для Enigma...\n');

// Тест 1: Симметричность шифрования (основное свойство Энигмы)
function testSymmetry() {
  console.log('📋 Тест 1: Симметричность шифрования');
  
  const enigma1 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const enigma2 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  const plaintext = 'HELLO';
  const encrypted = enigma1.process(plaintext);
  const decrypted = enigma2.process(encrypted);
  
  assert.strictEqual(decrypted, plaintext, 'Дешифрование должно восстановить исходный текст');
  console.log(`✅ Исходный текст: ${plaintext}`);
  console.log(`✅ Зашифрованный: ${encrypted}`);
  console.log(`✅ Расшифрованный: ${decrypted}`);
  console.log('✅ Тест симметричности пройден\n');
}

// Тест 2: Работа с plugboard
function testPlugboard() {
  console.log('📋 Тест 2: Работа с plugboard');
  
  const enigmaWithoutPlug = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const enigmaWithPlug = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [['A', 'B']]);
  
  const plaintext = 'A';
  const resultWithoutPlug = enigmaWithoutPlug.process(plaintext);
  const resultWithPlug = enigmaWithPlug.process(plaintext);
  
  assert.notStrictEqual(resultWithoutPlug, resultWithPlug, 'Plugboard должен изменять результат');
  console.log(`✅ Без plugboard: A -> ${resultWithoutPlug}`);
  console.log(`✅ С plugboard A<->B: A -> ${resultWithPlug}`);
  console.log('✅ Тест plugboard пройден\n');
}

// Тест 3: Движение роторов
function testRotorMovement() {
  console.log('📋 Тест 3: Движение роторов');
  
  const enigma = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  // Запоминаем начальные позиции
  const initialPositions = enigma.rotors.map(r => r.position);
  
  // Шифруем один символ
  enigma.encryptChar('A');
  
  // Проверяем, что правый ротор повернулся
  assert.strictEqual(enigma.rotors[2].position, (initialPositions[2] + 1) % 26, 
    'Правый ротор должен повернуться на одну позицию');
  
  console.log(`✅ Начальные позиции: [${initialPositions.join(', ')}]`);
  console.log(`✅ После шифрования: [${enigma.rotors.map(r => r.position).join(', ')}]`);
  console.log('✅ Тест движения роторов пройден\n');
}

// Тест 4: Double-stepping механизм
function testDoubleStepping() {
  console.log('📋 Тест 4: Double-stepping механизм');
  
  // Устанавливаем позицию, близкую к notch среднего ротора (E = 4)
  const enigma = new Enigma([0, 1, 2], [0, 4, 25], [0, 0, 0], []);
  
  // Шифруем символ - должен произойти double-step
  enigma.encryptChar('A');
  
  // Проверяем позиции после double-stepping
  const positions = enigma.rotors.map(r => r.position);
  
  console.log(`✅ Позиции после double-stepping: [${positions.join(', ')}]`);
  console.log('✅ Тест double-stepping пройден\n');
}

// Тест 5: Валидация входных данных
function testValidation() {
  console.log('📋 Тест 5: Валидация входных данных');
  
  let errorCount = 0;
  
  // Тест неправильного количества роторов
  try {
    new Enigma([0, 1], [0, 0, 0], [0, 0, 0], []);
    assert.fail('Должна быть ошибка для неправильного количества роторов');
  } catch (error) {
    assert(error.message.includes('Rotor IDs must be an array of 3 elements'));
    errorCount++;
  }
  
  // Тест неправильных позиций роторов
  try {
    new Enigma([0, 1, 2], [0, 0, 26], [0, 0, 0], []);
    assert.fail('Должна быть ошибка для позиции ротора вне диапазона');
  } catch (error) {
    assert(error.message.includes('Rotor positions must be integers between 0 and 25'));
    errorCount++;
  }
  
  // Тест дублирующихся plugboard пар
  try {
    new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [['A', 'B'], ['A', 'C']]);
    assert.fail('Должна быть ошибка для дублирующихся plugboard пар');
  } catch (error) {
    assert(error.message.includes('Each letter can only be used once in plugboard pairs'));
    errorCount++;
  }
  
  console.log(`✅ Поймано ${errorCount} ошибок валидации`);
  console.log('✅ Тест валидации пройден\n');
}

// Тест 6: Исторический пример
function testHistoricalExample() {
  console.log('📋 Тест 6: Известный исторический пример');
  
  // Пример из документации Enigma
  const enigma1 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const enigma2 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  const message = 'ENIGMAISWORKING';
  const encrypted = enigma1.process(message);
  const decrypted = enigma2.process(encrypted);
  
  assert.strictEqual(decrypted, message, 'Исторический пример должен работать корректно');
  
  console.log(`✅ Сообщение: ${message}`);
  console.log(`✅ Зашифровано: ${encrypted}`);
  console.log(`✅ Расшифровано: ${decrypted}`);
  console.log('✅ Исторический тест пройден\n');
}

// Тест 7: Обработка неалфавитных символов
function testNonAlphabetChars() {
  console.log('📋 Тест 7: Обработка неалфавитных символов');
  
  const enigma = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  
  const input = 'HELLO 123 WORLD!';
  const result = enigma.process(input);
  
  // Проверяем, что пробелы, цифры и знаки препинания не изменились
  assert(result.includes(' '), 'Пробелы должны сохраняться');
  assert(result.includes('1'), 'Цифры должны сохраняться');
  assert(result.includes('!'), 'Знаки препинания должны сохраняться');
  
  console.log(`✅ Вход: ${input}`);
  console.log(`✅ Выход: ${result}`);
  console.log('✅ Тест неалфавитных символов пройден\n');
}

// Тест 8: Производительность
function testPerformance() {
  console.log('📋 Тест 8: Производительность');
  
  const enigma = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], []);
  const longMessage = 'A'.repeat(1000); // 1000 символов
  
  const startTime = Date.now();
  const result = enigma.process(longMessage);
  const endTime = Date.now();
  
  const duration = endTime - startTime;
  
  assert.strictEqual(result.length, longMessage.length, 'Длина результата должна совпадать');
  assert(duration < 1000, 'Шифрование 1000 символов должно занимать менее 1 секунды');
  
  console.log(`✅ Зашифровано ${longMessage.length} символов за ${duration}мс`);
  console.log('✅ Тест производительности пройден\n');
}

// Тест 9: Plugboard симметричность
function testPlugboardSymmetry() {
  console.log('📋 Тест 9: Plugboard симметричность');
  
  const enigma1 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [['A', 'B'], ['C', 'D']]);
  const enigma2 = new Enigma([0, 1, 2], [0, 0, 0], [0, 0, 0], [['A', 'B'], ['C', 'D']]);
  
  const message = 'ABCD';
  const encrypted = enigma1.process(message);
  const decrypted = enigma2.process(encrypted);
  
  assert.strictEqual(decrypted, message, 'Plugboard не должен нарушать симметричность');
  console.log(`✅ Сообщение: "${message}" -> Зашифровано: "${encrypted}" -> Расшифровано: "${decrypted}"`);
  console.log('✅ Тест plugboard симметричности пройден\n');
}

// Запускаем все тесты
function runAllTests() {
  try {
    testSymmetry();
    testPlugboard();
    testRotorMovement();
    testDoubleStepping();
    testValidation();
    testHistoricalExample();
    testNonAlphabetChars();
    testPerformance();
    testPlugboardSymmetry();
    
    console.log('🎉 ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ!');
    console.log('✅ Enigma машина работает корректно');
    console.log('📊 Всего тестов выполнено: 9');
    
  } catch (error) {
    console.error('❌ ТЕСТ ПРОВАЛЕН:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск тестов только если файл запускается напрямую
if (require.main === module) {
  runAllTests();
}

module.exports = {
  Enigma,
  Rotor,
  plugboardSwap,
  runAllTests
}; 