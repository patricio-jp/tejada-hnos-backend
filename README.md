# tejada-hnos-backend

Guía rápida de instalación y ejecución para el proyecto Node + TypeScript.

## Requisitos

- Node.js (v18+ recomendado)
- npm (v9+ recomendado) o yarn
- PostgreSQL (v12+ recomendado)

## Pasos de instalación

1. Clona el repositorio:

	git clone https://github.com/patricio-jp/tejada-hnos-backend.git
	cd tejada-hnos-backend

2. Crea un archivo de variables de entorno `.env` a partir de `.env.example`.

	Copia el ejemplo y abre el archivo para ajustar valores:

	Windows PowerShell:

  ``` bash
	cp .env.example .env
  ```

	Luego abre .env en tu editor y modifica los valores según tu entorno

	El proyecto requiere al menos las siguientes variables en `.env`:

	- `PORT` — puerto donde correrá la app (ej. 3000)
	- `POSTGRES_HOST` — host de PostgreSQL (ej. localhost)
	- `POSTGRES_PORT` — puerto de PostgreSQL (ej. 5432)
	- `POSTGRES_USERNAME` — usuario de PostgreSQL
	- `POSTGRES_PASSWORD` — contraseña de PostgreSQL
	- `POSTGRES_DATABASE` — nombre de la base de datos

3. Instala dependencias:

	npm install

4. Ejecuta en modo desarrollo (con recarga automática):

	npm run dev

5. Para compilar TypeScript y ejecutar la versión de producción:

	npm run build
	npm start

## Sistema de Autenticación JWT 🔐

Este proyecto incluye un sistema completo de autenticación y autorización con:

- ✅ JWT (JSON Web Tokens) con expiración de 3 horas
- ✅ Refresh tokens para renovar el acceso (7 días)
- ✅ Middleware de autenticación para proteger endpoints
- ✅ Middleware de autorización por roles (ADMIN, OPERARIO)
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Revocación de tokens al cerrar sesión

### Configuración Adicional para JWT

Agrega estas variables a tu archivo `.env`:

```env
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here
JWT_EXPIRES_IN=3h
JWT_REFRESH_EXPIRES_IN=7d
```

### Crear Usuario Administrador Inicial

Después de configurar la base de datos, ejecuta:

```bash
npm run seed:admin
```

Esto creará un usuario administrador con las siguientes credenciales:
- **Email**: admin@tejadahnos.com
- **Password**: admin123
- **Rol**: ADMIN

⚠️ **IMPORTANTE**: Cambia la contraseña después del primer login.

### Documentación de Autenticación

- [Guía Rápida de Autenticación](docs/QUICK_START_AUTH.md)
- [Documentación Completa de Autenticación](docs/AUTHENTICATION.md)
- [Ejemplos de Requests HTTP](docs/api-requests.http)

### Ejemplo de Uso

```typescript
import { authenticate } from "@middlewares/auth.middleware";
import { authorize } from "@middlewares/authorize.middleware";
import { UserRole } from "@/enums";

// Ruta protegida (requiere autenticación)
router.get("/protected", authenticate, controller.method);

// Ruta solo para ADMIN
router.post("/admin-only", authenticate, authorize(UserRole.ADMIN), controller.method);
```

## Scripts útiles (definidos en `package.json`)

- `npm run dev` — Ejecuta con `ts-node` y `nodemon`, ideal para desarrollo.
- `npm run build` — Compila TypeScript a `dist/`.
- `npm start` — Ejecuta la build compilada desde `dist/`.
- `npm run seed:admin` — Crea un usuario administrador inicial.
- `npm test` — Ejecuta todos los tests con Jest.
- `npm run test:watch` — Ejecuta tests en modo watch (auto-rerun).
- `npm run test:coverage` — Genera reporte de cobertura de código.
- `npm run test:verbose` — Ejecuta tests con salida detallada.

## Testing 🧪

Este proyecto incluye testing completo con Jest y TypeScript:

- ✅ 31 tests automatizados funcionando
- ✅ Cobertura de código configurada
- ✅ Tests unitarios para utils, services y middlewares
- ✅ Configuración completa con ts-jest
- ✅ Soporte para mocks y spies

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch (re-ejecuta al guardar cambios)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

### Documentación de Testing

- [Guía Principal de Testing](docs/TESTING.md) - Introducción y comandos básicos
- [Ejemplos y Plantillas](docs/TESTING_EXAMPLES.md) - Cómo escribir nuevos tests
- [Configuración Avanzada](docs/TESTING_ADVANCED.md) - Tests E2E, CI/CD, etc.
- [Resumen de Integración](docs/JEST_INTEGRATION_SUMMARY.md) - Estado actual
- [Checklist de Verificación](docs/JEST_CHECKLIST.md) - Lista de verificación completa

### Estructura de Tests

```
src/
  utils/__tests__/
    jwt.utils.test.ts          (9 tests ✅)
    validation.utils.test.ts   (7 tests ✅)
  services/__tests__/
    auth.logic.test.ts         (9 tests ✅)
  middlewares/__tests__/
    middleware.test.ts         (6 tests ✅)
```

## Notas

- No incluyas el archivo `.env` en el repositorio. Usa `.env.example` como plantilla.
- Los archivos de cobertura de tests (`coverage/`) están excluidos del repositorio.
