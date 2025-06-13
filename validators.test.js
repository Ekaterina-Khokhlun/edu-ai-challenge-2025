const { Schema } = require('./schema');

describe('Validation Library Tests', () => {
  describe('StringValidator', () => {
    test('validates string type', () => {
      const validator = Schema.string();
      expect(validator.validate('test').isValid).toBe(true);
      expect(validator.validate(123).isValid).toBe(false);
    });

    test('validates min length', () => {
      const validator = Schema.string().minLength(3);
      expect(validator.validate('test').isValid).toBe(true);
      expect(validator.validate('ab').isValid).toBe(false);
    });

    test('validates max length', () => {
      const validator = Schema.string().maxLength(5);
      expect(validator.validate('test').isValid).toBe(true);
      expect(validator.validate('too long').isValid).toBe(false);
    });

    test('validates email pattern', () => {
      const validator = Schema.string().email();
      expect(validator.validate('test@example.com').isValid).toBe(true);
      expect(validator.validate('invalid-email').isValid).toBe(false);
    });
  });

  describe('NumberValidator', () => {
    test('validates number type', () => {
      const validator = Schema.number();
      expect(validator.validate(123).isValid).toBe(true);
      expect(validator.validate('123').isValid).toBe(false);
    });

    test('validates min value', () => {
      const validator = Schema.number().min(5);
      expect(validator.validate(10).isValid).toBe(true);
      expect(validator.validate(3).isValid).toBe(false);
    });

    test('validates max value', () => {
      const validator = Schema.number().max(10);
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(15).isValid).toBe(false);
    });

    test('validates integer', () => {
      const validator = Schema.number().integer();
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(5.5).isValid).toBe(false);
    });
  });

  describe('BooleanValidator', () => {
    test('validates boolean type', () => {
      const validator = Schema.boolean();
      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate(false).isValid).toBe(true);
      expect(validator.validate('true').isValid).toBe(false);
    });
  });

  describe('DateValidator', () => {
    test('validates date type', () => {
      const validator = Schema.date();
      expect(validator.validate(new Date()).isValid).toBe(true);
      expect(validator.validate('2023-01-01').isValid).toBe(true);
      expect(validator.validate('invalid-date').isValid).toBe(false);
    });

    test('validates min date', () => {
      const validator = Schema.date().min('2023-01-01');
      expect(validator.validate('2023-06-01').isValid).toBe(true);
      expect(validator.validate('2022-12-31').isValid).toBe(false);
    });

    test('validates max date', () => {
      const validator = Schema.date().max('2023-12-31');
      expect(validator.validate('2023-06-01').isValid).toBe(true);
      expect(validator.validate('2024-01-01').isValid).toBe(false);
    });
  });

  describe('ArrayValidator', () => {
    test('validates array type', () => {
      const validator = Schema.array(Schema.string());
      expect(validator.validate(['test']).isValid).toBe(true);
      expect(validator.validate('not-array').isValid).toBe(false);
    });

    test('validates array items', () => {
      const validator = Schema.array(Schema.number());
      expect(validator.validate([1, 2, 3]).isValid).toBe(true);
      expect(validator.validate([1, '2', 3]).isValid).toBe(false);
    });

    test('validates min length', () => {
      const validator = Schema.array(Schema.string()).minLength(2);
      expect(validator.validate(['a', 'b']).isValid).toBe(true);
      expect(validator.validate(['a']).isValid).toBe(false);
    });

    test('validates max length', () => {
      const validator = Schema.array(Schema.string()).maxLength(2);
      expect(validator.validate(['a', 'b']).isValid).toBe(true);
      expect(validator.validate(['a', 'b', 'c']).isValid).toBe(false);
    });
  });

  describe('ObjectValidator', () => {
    const addressSchema = Schema.object({
      street: Schema.string(),
      city: Schema.string(),
      postalCode: Schema.string().pattern(/^\d{5}$/),
      country: Schema.string()
    });

    test('validates object type', () => {
      expect(addressSchema.validate({
        street: '123 Main St',
        city: 'Anytown',
        postalCode: '12345',
        country: 'USA'
      }).isValid).toBe(true);
    });

    test('validates required fields', () => {
      expect(addressSchema.validate({
        street: '123 Main St',
        city: 'Anytown',
        country: 'USA'
      }).isValid).toBe(false);
    });

    test('validates nested objects', () => {
      const userSchema = Schema.object({
        name: Schema.string(),
        address: addressSchema
      });

      expect(userSchema.validate({
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          postalCode: '12345',
          country: 'USA'
        }
      }).isValid).toBe(true);
    });

    test('validates optional fields', () => {
      const schema = Schema.object({
        required: Schema.string(),
        optional: Schema.string().optional()
      });

      expect(schema.validate({
        required: 'value'
      }).isValid).toBe(true);
    });
  });

  describe('Custom Error Messages', () => {
    test('uses custom error message', () => {
      const validator = Schema.string()
        .minLength(5)
        .withMessage('String too short!');

      const result = validator.validate('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('String too short!');
    });
  });
});

describe('Complex Nested Schema', () => {
  // Пример: массив заказов, каждый заказ — объект с массивом товаров и вложенным адресом
  const productSchema = Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    price: Schema.number().min(0)
  });

  const addressSchema = Schema.object({
    street: Schema.string(),
    city: Schema.string(),
    postalCode: Schema.string().pattern(/^\d{5}$/),
    country: Schema.string()
  });

  const orderSchema = Schema.object({
    orderId: Schema.string(),
    products: Schema.array(productSchema).minLength(1),
    shippingAddress: addressSchema,
    status: Schema.string().pattern(/^(new|processing|shipped|delivered)$/)
  });

  const ordersSchema = Schema.array(orderSchema);

  test('validates valid nested orders array', () => {
    const validOrders = [
      {
        orderId: 'A001',
        products: [
          { id: 'P1', name: 'Product 1', price: 100 },
          { id: 'P2', name: 'Product 2', price: 50 }
        ],
        shippingAddress: {
          street: 'Main St',
          city: 'Moscow',
          postalCode: '12345',
          country: 'Russia'
        },
        status: 'new'
      },
      {
        orderId: 'A002',
        products: [
          { id: 'P3', name: 'Product 3', price: 200 }
        ],
        shippingAddress: {
          street: 'Lenina',
          city: 'Kazan',
          postalCode: '54321',
          country: 'Russia'
        },
        status: 'shipped'
      }
    ];
    expect(ordersSchema.validate(validOrders).isValid).toBe(true);
  });

  test('invalid if product price is negative', () => {
    const invalidOrders = [
      {
        orderId: 'A003',
        products: [
          { id: 'P4', name: 'Product 4', price: -10 }
        ],
        shippingAddress: {
          street: 'Main St',
          city: 'Moscow',
          postalCode: '12345',
          country: 'Russia'
        },
        status: 'processing'
      }
    ];
    const result = ordersSchema.validate(invalidOrders);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/price/);
  });

  test('invalid if missing products array', () => {
    const invalidOrders = [
      {
        orderId: 'A004',
        shippingAddress: {
          street: 'Main St',
          city: 'Moscow',
          postalCode: '12345',
          country: 'Russia'
        },
        status: 'delivered'
      }
    ];
    const result = ordersSchema.validate(invalidOrders);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/products/);
  });

  test('invalid if status is not allowed', () => {
    const invalidOrders = [
      {
        orderId: 'A005',
        products: [
          { id: 'P5', name: 'Product 5', price: 10 }
        ],
        shippingAddress: {
          street: 'Main St',
          city: 'Moscow',
          postalCode: '12345',
          country: 'Russia'
        },
        status: 'cancelled' // невалидный статус
      }
    ];
    const result = ordersSchema.validate(invalidOrders);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/status/);
  });
});

describe('EnumValidator', () => {
  const colorSchema = Schema.enum(['red', 'green', 'blue']);
  test('valid value', () => {
    expect(colorSchema.validate('red').isValid).toBe(true);
  });
  test('invalid value', () => {
    const res = colorSchema.validate('yellow');
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/one of/);
  });
});

describe('NullableValidator', () => {
  const nullableString = Schema.nullable(Schema.string().minLength(2));
  test('accepts null', () => {
    expect(nullableString.validate(null).isValid).toBe(true);
  });
  test('accepts valid string', () => {
    expect(nullableString.validate('ok').isValid).toBe(true);
  });
  test('rejects short string', () => {
    expect(nullableString.validate('a').isValid).toBe(false);
  });
});

describe('CustomValidator', () => {
  const evenNumber = Schema.custom((v) => v % 2 === 0 || 'Must be even');
  test('valid even', () => {
    expect(evenNumber.validate(4).isValid).toBe(true);
  });
  test('invalid odd', () => {
    const res = evenNumber.validate(5);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Must be even');
  });
});

describe('Complex Nested + Custom Types', () => {
  // Пользователь с nullable middleName, enum role, кастомным валидатором возраста
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

  test('valid user', () => {
    const validUser = {
      id: 'u1',
      firstName: 'Ivan',
      middleName: null,
      lastName: 'Ivanov',
      age: 25,
      role: 'admin',
      tags: ['dev'],
      preferences: { theme: 'dark', notifications: true }
    };
    expect(userSchema.validate(validUser).isValid).toBe(true);
  });

  test('invalid user: wrong role', () => {
    const user = {
      id: 'u2',
      firstName: 'Ivan',
      middleName: null,
      lastName: 'Ivanov',
      age: 25,
      role: 'superuser',
      tags: ['dev'],
      preferences: { theme: 'dark', notifications: true }
    };
    const res = userSchema.validate(user);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/one of/);
  });

  test('invalid user: age out of range', () => {
    const user = {
      id: 'u3',
      firstName: 'Ivan',
      middleName: null,
      lastName: 'Ivanov',
      age: 120,
      role: 'user',
      tags: ['dev'],
      preferences: { theme: 'dark', notifications: true }
    };
    const res = userSchema.validate(user);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/Age must be 18-99/);
  });

  test('invalid user: missing tags', () => {
    const user = {
      id: 'u4',
      firstName: 'Ivan',
      middleName: null,
      lastName: 'Ivanov',
      age: 25,
      role: 'user',
      tags: [],
      preferences: { theme: 'dark', notifications: true }
    };
    const res = userSchema.validate(user);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/tags/);
  });

  test('invalid user: preferences.theme wrong', () => {
    const user = {
      id: 'u5',
      firstName: 'Ivan',
      middleName: null,
      lastName: 'Ivanov',
      age: 25,
      role: 'user',
      tags: ['dev'],
      preferences: { theme: 'blue', notifications: true }
    };
    const res = userSchema.validate(user);
    expect(res.isValid).toBe(false);
    expect(res.error).toMatch(/theme/);
  });
}); 