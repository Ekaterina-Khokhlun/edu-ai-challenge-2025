/**
 * @template T
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string=} error
 */

/**
 * Базовый класс валидатора. Все валидаторы наследуют этот класс.
 * @template T
 */
class Validator {
  constructor() {
    /** @type {((value: T) => ValidationResult<T>)[]} Список функций-проверок для значения */
    this.validations = [];
    /** @type {string|null} Сообщение об ошибке, если задано вручную */
    this.errorMessage = null;
    /** @type {boolean} Флаг опциональности поля */
    this.isOptionalFlag = false;
  }

  /**
   * Проверяет значение по всем правилам валидатора.
   * @param {T} value
   * @returns {ValidationResult<T>} Результат валидации
   */
  validate(value) {
    if (value === undefined || value === null) {
      return this.isOptionalFlag ? { isValid: true } : { isValid: false, error: 'Value is required' };
    }
    for (const validation of this.validations) {
      const result = validation(value);
      if (!result.isValid) {
        return { isValid: false, error: this.errorMessage || result.error };
      }
    }
    return { isValid: true };
  }

  /**
   * Устанавливает пользовательское сообщение об ошибке.
   * @param {string} message
   * @returns {this}
   */
  withMessage(message) {
    this.errorMessage = message;
    return this;
  }

  /**
   * Делает поле опциональным (необязательным).
   * @returns {this}
   */
  optional() {
    this.isOptionalFlag = true;
    return this;
  }
}

/**
 * Валидатор строковых значений.
 * @extends {Validator<string>}
 */
class StringValidator extends Validator {
  constructor() {
    super();
    // Проверка на тип string
    this.validations.push((value) => ({
      isValid: typeof value === 'string',
      error: 'Value must be a string'
    }));
  }
  /**
   * Минимальная длина строки
   * @param {number} length
   * @returns {this}
   */
  minLength(length) {
    this.validations.push((value) => ({
      isValid: value.length >= length,
      error: `Minimum length is ${length}`
    }));
    return this;
  }
  /**
   * Максимальная длина строки
   * @param {number} length
   * @returns {this}
   */
  maxLength(length) {
    this.validations.push((value) => ({
      isValid: value.length <= length,
      error: `Maximum length is ${length}`
    }));
    return this;
  }
  /**
   * Проверка по регулярному выражению
   * @param {RegExp} regex
   * @returns {this}
   */
  pattern(regex) {
    this.validations.push((value) => ({
      isValid: regex.test(value),
      error: 'Value does not match pattern'
    }));
    return this;
  }
  /**
   * Проверка email-адреса
   * @returns {this}
   */
  email() {
    return this.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
}

/**
 * Валидатор числовых значений.
 * @extends {Validator<number>}
 */
class NumberValidator extends Validator {
  constructor() {
    super();
    // Проверка на тип number
    this.validations.push((value) => ({
      isValid: typeof value === 'number' && !isNaN(value),
      error: 'Value must be a number'
    }));
  }
  /**
   * Минимальное значение
   * @param {number} min
   * @returns {this}
   */
  min(min) {
    this.validations.push((value) => ({
      isValid: value >= min,
      error: `Value must be >= ${min}`
    }));
    return this;
  }
  /**
   * Максимальное значение
   * @param {number} max
   * @returns {this}
   */
  max(max) {
    this.validations.push((value) => ({
      isValid: value <= max,
      error: `Value must be <= ${max}`
    }));
    return this;
  }
  /**
   * Проверка на целое число
   * @returns {this}
   */
  integer() {
    this.validations.push((value) => ({
      isValid: Number.isInteger(value),
      error: 'Value must be an integer'
    }));
    return this;
  }
}

/**
 * Валидатор булевых значений.
 * @extends {Validator<boolean>}
 */
class BooleanValidator extends Validator {
  constructor() {
    super();
    // Проверка на тип boolean
    this.validations.push((value) => ({
      isValid: typeof value === 'boolean',
      error: 'Value must be a boolean'
    }));
  }
}

/**
 * Валидатор дат (строка, число или объект Date).
 * @extends {Validator<Date|string|number>}
 */
class DateValidator extends Validator {
  constructor() {
    super();
    // Проверка на корректную дату
    this.validations.push((value) => {
      const date = new Date(value);
      return {
        isValid: !isNaN(date.getTime()),
        error: 'Value must be a valid date'
      };
    });
  }
  /**
   * Минимальная дата
   * @param {string|Date} minDate
   * @returns {this}
   */
  min(minDate) {
    this.validations.push((value) => ({
      isValid: new Date(value) >= new Date(minDate),
      error: `Date must be after ${minDate}`
    }));
    return this;
  }
  /**
   * Максимальная дата
   * @param {string|Date} maxDate
   * @returns {this}
   */
  max(maxDate) {
    this.validations.push((value) => ({
      isValid: new Date(value) <= new Date(maxDate),
      error: `Date must be before ${maxDate}`
    }));
    return this;
  }
}

/**
 * Валидатор массивов.
 * @template T
 * @extends {Validator<T[]>}
 */
class ArrayValidator extends Validator {
  /**
   * @param {Validator<T>} itemValidator Валидатор для элементов массива
   */
  constructor(itemValidator) {
    super();
    this.itemValidator = itemValidator;
    // Проверка на массив
    this.validations.push((value) => ({
      isValid: Array.isArray(value),
      error: 'Value must be an array'
    }));
  }
  /**
   * Минимальная длина массива
   * @param {number} length
   * @returns {this}
   */
  minLength(length) {
    this.validations.push((value) => ({
      isValid: value.length >= length,
      error: `Array must contain at least ${length} items`
    }));
    return this;
  }
  /**
   * Максимальная длина массива
   * @param {number} length
   * @returns {this}
   */
  maxLength(length) {
    this.validations.push((value) => ({
      isValid: value.length <= length,
      error: `Array must contain at most ${length} items`
    }));
    return this;
  }
  /**
   * Проверяет каждый элемент массива
   * @param {T[]} value
   * @returns {ValidationResult<T[]>}
   */
  validate(value) {
    const arrayResult = super.validate(value);
    if (!arrayResult.isValid) {
      return arrayResult;
    }
    for (let i = 0; i < value.length; i++) {
      const itemResult = this.itemValidator.validate(value[i]);
      if (!itemResult.isValid) {
        return {
          isValid: false,
          error: `Item at index ${i}: ${itemResult.error}`
        };
      }
    }
    return { isValid: true };
  }
}

/**
 * Валидатор объектов по схеме.
 * @template T
 * @extends {Validator<T>}
 */
class ObjectValidator extends Validator {
  /**
   * @param {Record<string, Validator<any>>} schema Схема объекта
   */
  constructor(schema) {
    super();
    this.schema = schema;
    // Проверка на объект
    this.validations.push((value) => ({
      isValid: typeof value === 'object' && value !== null && !Array.isArray(value),
      error: 'Value must be an object'
    }));
  }
  /**
   * Проверяет все поля объекта по схеме
   * @param {T} value
   * @returns {ValidationResult<T>}
   */
  validate(value) {
    const objectResult = super.validate(value);
    if (!objectResult.isValid) {
      return objectResult;
    }
    for (const [key, validator] of Object.entries(this.schema)) {
      if (!(key in value) && !validator.isOptionalFlag) {
        return {
          isValid: false,
          error: `Missing required field: ${key}`
        };
      }
      if (key in value) {
        const fieldResult = validator.validate(value[key]);
        if (!fieldResult.isValid) {
          return {
            isValid: false,
            error: `Field "${key}": ${fieldResult.error}`
          };
        }
      }
    }
    return { isValid: true };
  }
}

/**
 * Валидатор для значения из списка (enum).
 * @extends {Validator<string>}
 */
class EnumValidator extends Validator {
  /**
   * @param {string[]} allowed Список допустимых значений
   */
  constructor(allowed) {
    super();
    this.allowed = allowed;
    this.validations.push((value) => ({
      isValid: allowed.includes(value),
      error: `Value must be one of: ${allowed.join(', ')}`
    }));
  }
}

/**
 * Валидатор, разрешающий null.
 * @extends {Validator<any>}
 */
class NullableValidator extends Validator {
  /**
   * @param {Validator<any>} baseValidator Базовый валидатор
   */
  constructor(baseValidator) {
    super();
    this.baseValidator = baseValidator;
  }
  /**
   * Пропускает null, иначе валидирует базовым валидатором
   * @param {any} value
   * @returns {ValidationResult<any>}
   */
  validate(value) {
    if (value === null) return { isValid: true };
    return this.baseValidator.validate(value);
  }
}

/**
 * Валидатор с пользовательской функцией.
 * @extends {Validator<any>}
 */
class CustomValidator extends Validator {
  /**
   * @param {(value: any) => boolean | string} fn Функция-проверка
   */
  constructor(fn) {
    super();
    this.validations.push((value) => {
      const res = fn(value);
      if (res === true) return { isValid: true };
      return { isValid: false, error: typeof res === 'string' ? res : 'Custom validation failed' };
    });
  }
}

// Экспорт всех валидаторов
module.exports = {
  Validator,
  StringValidator,
  NumberValidator,
  BooleanValidator,
  DateValidator,
  ArrayValidator,
  ObjectValidator,
  EnumValidator,
  NullableValidator,
  CustomValidator
}; 