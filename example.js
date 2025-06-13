const {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  DateValidator,
  ArrayValidator,
  ObjectValidator
} = require('./validators');

// Функция для проверки значения на вхождение в список
class EnumValidator extends StringValidator {
  constructor(allowed) {
    super();
    this.allowed = allowed;
    this.validations.push((value) => ({
      isValid: allowed.includes(value),
      error: `Значение должно быть одним из: ${allowed.join(', ')}`
    }));
  }
}

// Удобный фасад
const Schema = {
  string: () => new StringValidator(),
  number: () => new NumberValidator(),
  boolean: () => new BooleanValidator(),
  date: () => new DateValidator(),
  array: (itemValidator) => new ArrayValidator(itemValidator),
  object: (schema) => new ObjectValidator(schema),
  enum: (allowed) => new EnumValidator(allowed)
};

// Пример схемы пользователя
const userSchema = Schema.object({
  id: Schema.string().withMessage('ID должен быть строкой'),
  name: Schema.string().minLength(2).maxLength(50),
  email: Schema.string().email().withMessage('Email обязателен и должен быть валидным'),
  age: Schema.number().integer().min(18).max(99).withMessage('Возраст должен быть целым числом от 18 до 99'),
  isActive: Schema.boolean(),
  tags: Schema.array(Schema.string()).minLength(1).maxLength(5).withMessage('Должен быть хотя бы 1 и не более 5 тегов'),
  address: Schema.object({
    street: Schema.string(),
    city: Schema.string(),
    postalCode: Schema.string().pattern(/^\d{5}$/).withMessage('Почтовый индекс должен быть из 5 цифр'),
    country: Schema.enum(["Россия", "США", "Казахстан"]).withMessage('Страна должна быть: Россия, США или Казахстан')
  }).optional()
});

// Корректные данные
const validUser = {
  id: "12345",
  name: "Иван Иванов",
  email: "ivan@example.com",
  age: 25,
  isActive: true,
  tags: ["разработчик", "дизайнер"],
  address: {
    street: "Ленина, 1",
    city: "Москва",
    postalCode: "12345",
    country: "Россия"
  }
};

// Ошибки по всем новым правилам
const invalidUsers = [
  {
    ...validUser,
    age: 17 // слишком маленький возраст
  },
  {
    ...validUser,
    age: 100 // слишком большой возраст
  },
  {
    ...validUser,
    age: 25,
    tags: [] // нет тегов
  },
  {
    ...validUser,
    age: 25,
    tags: ["a", "b", "c", "d", "e", "f"] // слишком много тегов
  },
  {
    ...validUser,
    age: 25,
    email: "ivanexample.com" // невалидный email
  },
  {
    ...validUser,
    age: 25,
    address: {
      ...validUser.address,
      country: "Германия" // страна не из списка
    }
  }
];

console.log('Проверка корректных данных:');
console.log(userSchema.validate(validUser));

invalidUsers.forEach((user, i) => {
  console.log(`\nПроверка некорректных данных #${i + 1}:`);
  console.log(userSchema.validate(user));
}); 