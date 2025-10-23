# 📚 Guía para Extender los Tests

Este documento proporciona ejemplos prácticos para agregar más tests a tu proyecto.

## 🏗️ Estructura Recomendada

```
src/
  services/
    user.service.ts
    __tests__/
      user.service.test.ts
  controllers/
    user.controller.ts
    __tests__/
      user.controller.test.ts
  middlewares/
    auth.middleware.ts
    __tests__/
      auth.middleware.test.ts
```

## 📝 Plantillas de Tests

### 1. Test de Servicio con TypeORM

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user.service';
import { User } from '@entities/user.entity';
import { UserRole } from '@enums/index';

// Crear mocks
const mockUser: User = {
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
};

describe('UserService', () => {
  let service: UserService;
  let mockDataSource: Partial<DataSource>;
  let mockRepository: Partial<Repository<User>>;

  beforeEach(() => {
    // Reset mocks antes de cada test
    jest.clearAllMocks();

    // Configurar mock del repository
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Configurar mock del DataSource
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    // Crear instancia del servicio con los mocks
    service = new UserService(mockDataSource as DataSource);
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findById('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123e4567-e89b-12d3-a456-426614174000' }
      });
    });

    it('should return null when user not found', async () => {
      (mockRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
```

### 2. Test de Controller

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../user.controller';
import { UserService } from '@services/user.service';

// Mock del servicio
jest.mock('@services/user.service');

describe('UserController', () => {
  let controller: UserController;
  let mockService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = new UserService({} as any) as jest.Mocked<UserService>;
    controller = new UserController(mockService);

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any,
    };
  });

  describe('getUser', () => {
    it('should return user data with 200 status', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      };

      mockRequest.params = { id: userId };
      mockService.findById = jest.fn().mockResolvedValue(mockUser);

      await controller.getUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockService.findById = jest.fn().mockResolvedValue(null);

      await controller.getUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });
});
```

### 3. Test de Middleware

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../auth.middleware';
import { JwtUtils } from '@utils/jwt.utils';

// Mock de JwtUtils
jest.mock('@utils/jwt.utils');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
    nextFunction = jest.fn();
  });

  it('should call next() with valid token', () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    const mockPayload = {
      userId: '123',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    (JwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(mockPayload);
  });

  it('should return 401 without authorization header', () => {
    authMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
```

### 4. Test de Utilidad

```typescript
import { describe, expect, it } from '@jest/globals';
import { formatDate, isValidUUID } from '../format.utils';

describe('Format Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-10-22T10:00:00Z');
      const formatted = formatDate(date, 'YYYY-MM-DD');
      
      expect(formatted).toBe('2025-10-22');
    });

    it('should handle invalid dates', () => {
      const formatted = formatDate(null, 'YYYY-MM-DD');
      
      expect(formatted).toBe('');
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(null)).toBe(false);
    });
  });
});
```

### 5. Test de DTO/Validación

```typescript
import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { CreateUserDto } from '../user.dto';

describe('CreateUserDto', () => {
  it('should validate correct data', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.password = 'Password123!';
    dto.name = 'Test';
    dto.lastName = 'User';
    dto.role = 'ADMIN';

    const errors = await validate(dto);
    
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid email', async () => {
    const dto = new CreateUserDto();
    dto.email = 'invalid-email';
    dto.password = 'Password123!';
    dto.name = 'Test';
    dto.lastName = 'User';
    dto.role = 'ADMIN';

    const errors = await validate(dto);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject weak password', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.password = 'weak';
    dto.name = 'Test';
    dto.lastName = 'User';
    dto.role = 'ADMIN';

    const errors = await validate(dto);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });
});
```

## 🎯 Tests de Integración

### Test E2E con Supertest

```typescript
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import { DataSource } from 'typeorm';

describe('Auth API E2E Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Configurar base de datos de prueba
    dataSource = await createTestDataSource();
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });
});
```

## 🔧 Configuración para Tests de Integración

### Crear Base de Datos en Memoria

```typescript
// test-utils/database.ts
import { DataSource } from 'typeorm';
import { User } from '@entities/user.entity';
import { Field } from '@entities/field.entity';
import { Plot } from '@entities/plot.entity';

export async function createTestDataSource(): Promise<DataSource> {
  return new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [User, Field, Plot],
    synchronize: true,
    logging: false,
  });
}
```

## 📊 Mejores Prácticas

1. **AAA Pattern**: Arrange, Act, Assert
2. **Nombres Descriptivos**: Usa "should" en las descripciones
3. **Un Test, Un Concepto**: Cada test debe verificar una sola cosa
4. **Limpieza**: Usa beforeEach/afterEach para limpiar estado
5. **Mocks Aislados**: No dependas de servicios reales
6. **Datos de Test**: Usa factories o builders para crear datos de prueba

## 🚀 Ejecutar Tests Específicos

```bash
# Ejecutar solo tests de un archivo
npm test jwt.utils.test.ts

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="should validate"

# Ejecutar tests en un directorio específico
npm test src/services

# Ejecutar con cobertura para un archivo específico
npm test -- --coverage --collectCoverageFrom=src/services/auth.service.ts
```

## 📝 Tips Adicionales

### Mock de Módulos Externos

```typescript
// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-token'),
  verify: jest.fn().mockReturnValue({ userId: '123' }),
}));
```

### Spies para Verificar Llamadas

```typescript
const spy = jest.spyOn(service, 'methodName');

// Ejecutar código que llama al método

expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledTimes(1);
expect(spy).toHaveBeenCalledWith(expectedArg);

spy.mockRestore(); // Restaurar implementación original
```

### Test de Funciones Asíncronas

```typescript
// Opción 1: async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// Opción 2: done callback
it('should handle async operations', (done) => {
  asyncFunction().then(result => {
    expect(result).toBe('expected');
    done();
  });
});

// Opción 3: return promise
it('should handle async operations', () => {
  return asyncFunction().then(result => {
    expect(result).toBe('expected');
  });
});
```

---

¡Utiliza estas plantillas como punto de partida para crear tus propios tests!
