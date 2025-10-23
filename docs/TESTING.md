# Testing con Jest

Este proyecto utiliza Jest para testing. A continuación se explica cómo ejecutar y escribir tests.

## 📦 Dependencias Instaladas

- **jest**: Framework de testing
- **ts-jest**: Preset de Jest para TypeScript
- **@types/jest**: Tipos de TypeScript para Jest
- **@jest/globals**: Tipos globales de Jest

## 🚀 Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (auto-rerun al guardar cambios)
npm run test:watch

# Ejecutar tests con cobertura de código
npm run test:coverage

# Ejecutar tests con salida verbose
npm run test:verbose
```

## 📁 Estructura de Tests

Los tests están organizados en carpetas `__tests__` junto al código que prueban:

```
src/
  utils/
    jwt.utils.ts
    __tests__/
      jwt.utils.test.ts
  services/
    auth.service.ts
    __tests__/
      auth.service.test.ts
  middlewares/
    auth.middleware.ts
    __tests__/
      middleware.test.ts
```

## ✍️ Escribir Tests

### Test Básico

```typescript
import { describe, expect, it } from '@jest/globals';

describe('MiModulo', () => {
  it('debería hacer algo', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });
});
```

### Test con Mocks

```typescript
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

jest.mock('@services/user.service');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería autenticar usuario', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    // ... test logic
  });
});
```

### Test de Servicios con Base de Datos

Para testear servicios que usan TypeORM, usa mocks:

```typescript
import { DataSource, Repository } from 'typeorm';

let mockDataSource: jest.Mocked<DataSource>;
let mockRepository: jest.Mocked<Repository<Entity>>;

beforeEach(() => {
  mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    // ... otros métodos
  } as any;

  mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRepository),
  } as any;
});
```

## 🎯 Ejemplos de Tests Creados

### 1. JWT Utils Tests (`src/utils/__tests__/jwt.utils.test.ts`)
- Generación de tokens de acceso
- Generación de refresh tokens
- Verificación de tokens válidos
- Manejo de tokens inválidos o expirados

### 2. Auth Service Tests (`src/services/__tests__/auth.service.test.ts`)
- Login con credenciales válidas
- Login con credenciales inválidas
- Refresh token válido
- Manejo de errores

### 3. Validation Utils Tests (`src/utils/__tests__/validation.utils.test.ts`)
- Validación de emails
- Validación de contraseñas
- Casos edge

### 4. Middleware Tests (`src/middlewares/__tests__/middleware.test.ts`)
- Autenticación
- Validación de requests

## 📊 Cobertura de Código

La cobertura de código se genera en la carpeta `coverage/`:

```bash
npm run test:coverage
```

Esto generará un reporte HTML en `coverage/lcov-report/index.html` que puedes abrir en tu navegador.

## 🔧 Configuración

La configuración de Jest está en `jest.config.js`. Incluye:

- **Preset**: ts-jest para TypeScript
- **Test Environment**: node
- **Module Mapping**: Alias de paths configurados (@config, @services, etc.)
- **Coverage**: Configuración de reportes de cobertura
- **Setup**: Archivo de setup en `src/__tests__/setup.ts`

## 📝 Mejores Prácticas

1. **Nombres descriptivos**: Usa descripciones claras de lo que prueba cada test
2. **Arrange-Act-Assert**: Estructura tus tests en tres partes:
   - Arrange: Prepara los datos
   - Act: Ejecuta la acción
   - Assert: Verifica el resultado

3. **Un concepto por test**: Cada test debe verificar una sola cosa
4. **Limpia después de cada test**: Usa `beforeEach` y `afterEach` para limpiar
5. **Mock external dependencies**: No dependas de bases de datos reales o APIs externas
6. **Test edge cases**: No solo el happy path, también errores y casos límite

## 🐛 Debugging Tests

Para debuggear tests en VS Code:

1. Abre el archivo de test
2. Coloca un breakpoint
3. Ejecuta "Debug Jest Tests" desde el menú de debug

## 🔄 Integración Continua

Los tests se pueden integrar fácilmente en CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
