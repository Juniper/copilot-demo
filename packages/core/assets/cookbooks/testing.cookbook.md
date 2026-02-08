# Testing Strategies Cookbook

Comprehensive testing patterns and best practices for modern software development.

## Testing Pyramid

```
       /\
      /e2e\        Few, slow, expensive
     /------\
    /  API  \      More, moderate speed
   /--------\
  / Unit     \     Many, fast, cheap
 /-----------\
```

## Unit Testing

### Structure: Arrange-Act-Assert (AAA)

```javascript
describe('Calculator', () => {
  it('should add two numbers', () => {
    // Arrange
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act
    const result = calculator.add(a, b);

    // Assert
    expect(result).toBe(8);
  });
});
```

### Test Organization
```
├── src/
│   ├── calculator.ts
│   └── calculator.test.ts
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
```

## Integration Testing

### Database Testing
```javascript
describe('UserRepository', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create user in database', async () => {
    const user = await userRepo.create({ name: 'John' });
    const found = await userRepo.findById(user.id);

    expect(found).toMatchObject({ name: 'John' });
  });
});
```

### API Testing
```javascript
describe('POST /api/users', () => {
  it('should create new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Alice', email: 'alice@example.com' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Alice');
  });
});
```

## Test Doubles

### Mocks
```javascript
const mockUserService = {
  getUser: jest.fn().mockResolvedValue({ id: 1, name: 'John' })
};
```

### Stubs
```javascript
const stub = sinon.stub(database, 'query')
  .returns(Promise.resolve(mockData));
```

### Spies
```javascript
const spy = jest.spyOn(logger, 'error');
doSomething();
expect(spy).toHaveBeenCalledWith('Error occurred');
```

## Test Coverage

### What to Cover
- ✅ Critical business logic
- ✅ Error handling paths
- ✅ Edge cases and boundaries
- ✅ Public APIs and interfaces
- ❌ Third-party libraries
- ❌ Simple getters/setters
- ❌ Configuration files

### Coverage Metrics
```bash
# Aim for: 80% overall, 100% for critical paths
npm run test:coverage

--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
calculator.ts       |     100 |      100 |     100 |     100 |
utils.ts            |    87.5 |       75 |     100 |    87.5 |
--------------------|---------|----------|---------|---------|
```

## End-to-End Testing

### Use Page Object Pattern
```javascript
class LoginPage {
  async navigate() {
    await page.goto('/login');
  }

  async login(email, password) {
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#login-button');
  }
}

test('user can login', async () => {
  const loginPage = new LoginPage();
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');

  await expect(page).toHaveURL('/dashboard');
});
```

## Test Data Management

### Fixtures
```javascript
// fixtures/users.json
{
  "validUser": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "adminUser": {
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Factories
```javascript
const userFactory = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  name: faker.name.findName(),
  email: faker.internet.email(),
  createdAt: new Date(),
  ...overrides
});

const user = userFactory({ name: 'Custom Name' });
```

## Continuous Integration

### GitHub Actions
```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Best Practices

1. **Fast Tests**: Keep unit tests under 100ms
2. **Isolated**: Tests should not depend on each other
3. **Repeatable**: Same input = same output
4. **Self-checking**: No manual verification needed
5. **Timely**: Write tests as you write code (TDD)
6. **One Assertion**: Test one thing at a time
7. **Readable**: Tests are documentation
8. **DRY**: But don't over-abstract test code
9. **Clean Up**: Always clean up resources
10. **Flaky Tests**: Fix or remove them immediately

## TDD Red-Green-Refactor

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while keeping tests green

```javascript
// 1. Red: Write failing test
it('should calculate discount', () => {
  expect(calculateDiscount(100, 10)).toBe(90);
});

// 2. Green: Make it pass
function calculateDiscount(price, percent) {
  return price - (price * percent / 100);
}

// 3. Refactor: Improve
function calculateDiscount(price, percent) {
  if (price < 0 || percent < 0 || percent > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - percent / 100);
}
```
