# 🚀 Configuración Adicional Recomendada

## Tests E2E con Supertest (Opcional)

Si deseas agregar tests end-to-end para tus API endpoints, puedes instalar supertest:

### Instalación

```bash
npm install --save-dev supertest @types/supertest
```

### Ejemplo de uso

```typescript
import request from 'supertest';
import { app } from '../index';

describe('Auth Endpoints', () => {
  it('POST /api/auth/login - should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

## Base de Datos en Memoria para Tests

Para tests de integración sin afectar tu BD real:

### Opción 1: SQLite en memoria

```bash
npm install --save-dev sqlite3
```

```typescript
// test-utils/test-database.ts
import { DataSource } from 'typeorm';

export const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: ['src/entities/**/*.ts'],
  synchronize: true,
  logging: false,
});
```

### Opción 2: PostgreSQL Testcontainers

```bash
npm install --save-dev testcontainers
```

## Pre-commit Hooks con Husky

Ejecuta tests automáticamente antes de commits:

```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npm test"
```

### package.json
```json
{
  "lint-staged": {
    "*.ts": [
      "npm test -- --findRelatedTests"
    ]
  }
}
```

## GitHub Actions CI

Crea `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Generate coverage
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

## Cobertura en SonarQube

### sonar-project.properties
```properties
sonar.projectKey=tejada-hnos-backend
sonar.projectName=Tejada Hnos Backend
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/__tests__/**
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

## Mocking Avanzado

### Mock de TypeORM Repository

```typescript
// test-utils/mocks/repository.mock.ts
export const createMockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
});
```

### Factory Pattern para Tests

```typescript
// test-utils/factories/user.factory.ts
import { User } from '@entities/user.entity';
import { UserRole } from '@enums/index';

export class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      fields: [],
      activityLogs: [],
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ 
        id: `user-${i}`,
        email: `test${i}@example.com`,
        ...overrides 
      })
    );
  }
}

// Uso:
const user = UserFactory.create({ name: 'Custom Name' });
const users = UserFactory.createMany(5);
```

## Test Utilities

```typescript
// test-utils/helpers.ts

/**
 * Espera un tiempo específico (útil para tests de async)
 */
export const wait = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Crea un mock de Express Request
 */
export const mockRequest = (overrides?: any) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

/**
 * Crea un mock de Express Response
 */
export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Crea un mock de NextFunction
 */
export const mockNext = () => jest.fn();
```

## Debugging Tests en VS Code

Crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${fileBasenameNoExtension}",
        "--config",
        "jest.config.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest All Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--config",
        "jest.config.js"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

## Test Watch con Filtros

Agrega a `package.json`:

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern='.*.test.ts$'",
    "test:integration": "jest --testPathPattern='.*.integration.test.ts$'",
    "test:e2e": "jest --testPathPattern='.*.e2e.test.ts$'",
    "test:changed": "jest --onlyChanged",
    "test:related": "jest --findRelatedTests"
  }
}
```

## Métricas de Calidad

### Configurar umbral de cobertura mínimo

En `jest.config.js`:

```javascript
module.exports = {
  // ... otras configuraciones
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Snapshot Testing

```typescript
import { UserController } from '../user.controller';

describe('UserController Snapshots', () => {
  it('should match user response snapshot', async () => {
    const controller = new UserController(mockService);
    const response = await controller.getUser(req, res);
    
    expect(response).toMatchSnapshot();
  });
});
```

## Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should complete operation within time limit', async () => {
    const startTime = Date.now();
    
    await heavyOperation();
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // menos de 1 segundo
  });
});
```

---

Estas configuraciones son opcionales pero altamente recomendadas para proyectos en producción.
