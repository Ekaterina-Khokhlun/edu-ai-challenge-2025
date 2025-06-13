// Schema Builder
const {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  DateValidator,
  ArrayValidator,
  ObjectValidator,
  EnumValidator,
  NullableValidator,
  CustomValidator
} = require('./validators');

/**
 * Фасад для создания валидаторов различных типов.
 * Все методы возвращают соответствующий валидатор.
 */
class Schema {
  /**
   * Валидатор строк
   * @returns {StringValidator}
   */
  static string() { return new StringValidator(); }
  /**
   * Валидатор чисел
   * @returns {NumberValidator}
   */
  static number() { return new NumberValidator(); }
  /**
   * Валидатор булевых значений
   * @returns {BooleanValidator}
   */
  static boolean() { return new BooleanValidator(); }
  /**
   * Валидатор дат
   * @returns {DateValidator}
   */
  static date() { return new DateValidator(); }
  /**
   * Валидатор объектов по схеме
   * @param {Record<string, Validator<any>>} schema
   * @returns {ObjectValidator}
   */
  static object(schema) { return new ObjectValidator(schema); }
  /**
   * Валидатор массивов
   * @param {Validator<any>} itemValidator
   * @returns {ArrayValidator}
   */
  static array(itemValidator) { return new ArrayValidator(itemValidator); }
  /**
   * Валидатор значения из списка
   * @param {string[]} allowed
   * @returns {EnumValidator}
   */
  static enum(allowed) { return new EnumValidator(allowed); }
  /**
   * Валидатор, разрешающий null
   * @param {Validator<any>} baseValidator
   * @returns {NullableValidator}
   */
  static nullable(baseValidator) { return new NullableValidator(baseValidator); }
  /**
   * Валидатор с пользовательской функцией
   * @param {(value: any) => boolean | string} fn
   * @returns {CustomValidator}
   */
  static custom(fn) { return new CustomValidator(fn); }
}

// Define a complex schema
const addressSchema = Schema.object({
  street: Schema.string(),
  city: Schema.string(),
  postalCode: Schema.string().pattern(/^\d{5}$/).withMessage('Postal code must be 5 digits'),
  country: Schema.string()
});

const userSchema = Schema.object({
  id: Schema.string().withMessage('ID must be a string'),
  name: Schema.string().minLength(2).maxLength(50),
  email: Schema.string().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  age: Schema.number().optional(),
  isActive: Schema.boolean(),
  tags: Schema.array(Schema.string()),
  address: addressSchema.optional(),
  metadata: Schema.object({}).optional()
});

// Validate data
const userData = {
  id: "12345",
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
  tags: ["developer", "designer"],
  address: {
    street: "123 Main St",
    city: "Anytown",
    postalCode: "12345",
    country: "USA"
  }
};

const result = userSchema.validate(userData);

module.exports = { Schema };
