# Validation Library

A robust and flexible validation library for JavaScript that supports complex data structures with a fluent API.

## Features

- Type validation for primitive types (string, number, boolean)
- Date validation with range checks
- Array validation with item type checking
- Object validation with nested schemas
- Enum validation (value from list)
- Nullable fields
- Custom validation functions
- Custom error messages
- Optional fields support
- Pattern matching for strings
- Numeric range validation
- Array length validation
- Chainable API

## Installation

```bash
npm install
```

## Usage

### Basic Types

```javascript
const { Schema } = require('./schema');

// String validation
const stringValidator = Schema.string()
  .minLength(3)
  .maxLength(50)
  .withMessage('Invalid string length');

// Number validation
const numberValidator = Schema.number()
  .min(0)
  .max(100)
  .integer();

// Boolean validation
const booleanValidator = Schema.boolean();

// Date validation
const dateValidator = Schema.date()
  .min('2023-01-01')
  .max('2023-12-31');
```

### Arrays

```javascript
const arrayValidator = Schema.array(Schema.string())
  .minLength(1)
  .maxLength(10);

const result = arrayValidator.validate(['test']);
console.log(result.isValid); // true
```

### Objects

```javascript
const addressSchema = Schema.object({
  street: Schema.string(),
  city: Schema.string(),
  postalCode: Schema.string().pattern(/^\d{5}$/),
  country: Schema.string()
});

const userSchema = Schema.object({
  id: Schema.string(),
  name: Schema.string().minLength(2).maxLength(50),
  email: Schema.string().email(),
  age: Schema.number().optional(),
  address: addressSchema
});

const result = userSchema.validate({
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "Anytown",
    postalCode: "12345",
    country: "USA"
  }
});
```

### Enum

```javascript
const colorValidator = Schema.enum(['red', 'green', 'blue']);
colorValidator.validate('red'); // { isValid: true }
colorValidator.validate('yellow'); // { isValid: false, error: ... }
```

### Nullable

```javascript
const nullableString = Schema.nullable(Schema.string().minLength(2));
nullableString.validate(null); // { isValid: true }
nullableString.validate('ok'); // { isValid: true }
nullableString.validate('a'); // { isValid: false }
```

### Custom Validator

```javascript
const evenNumber = Schema.custom((v) => v % 2 === 0 || 'Must be even');
evenNumber.validate(4); // { isValid: true }
evenNumber.validate(5); // { isValid: false, error: 'Must be even' }
```

### Complex Nested Example

```javascript
const userSchema = Schema.object({
  id: Schema.string(),
  firstName: Schema.string(),
  middleName: Schema.nullable(Schema.string().minLength(2)),
  lastName: Schema.string(),
  age: Schema.custom((v) => v >= 18 && v <= 99 || 'Age must be 18-99'),
  role: Schema.enum(['admin', 'user', 'guest']),
  tags: Schema.array(Schema.string()).minLength(1),
  preferences: Schema.object({
    theme: Schema.enum(['light', 'dark']),
    notifications: Schema.boolean()
  })
});
```

## API Reference

### StringValidator
- `minLength(length)`: Set minimum string length
- `maxLength(length)`: Set maximum string length
- `pattern(regex)`: Validate string against regex pattern
- `email()`: Validate email format

### NumberValidator
- `min(value)`: Set minimum value
- `max(value)`: Set maximum value
- `integer()`: Require integer values

### DateValidator
- `min(date)`: Set minimum date
- `max(date)`: Set maximum date

### ArrayValidator
- `minLength(length)`: Set minimum array length
- `maxLength(length)`: Set maximum array length

### ObjectValidator
- Validates object structure against schema
- Supports nested validation
- Handles optional fields

### EnumValidator
- Checks value is in allowed list

### NullableValidator
- Allows null values, otherwise validates as base validator

### CustomValidator
- Accepts a custom function `(value) => boolean | string` (return string for error)

### Common Methods
- `optional()`: Mark field as optional
- `withMessage(message)`: Set custom error message

## Testing

Run the test suite:

```bash
npm test
```

### Coverage

Для проверки покрытия тестами используйте:

```bash
npx jest --coverage
```

Минимальное покрытие: **60%** (фактически выше)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 