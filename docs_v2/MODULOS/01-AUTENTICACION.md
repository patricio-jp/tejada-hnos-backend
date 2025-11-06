# 🔐 Módulo de Autenticación

## Índice
- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Componentes del Módulo](#componentes-del-módulo)
- [Endpoints](#endpoints)
- [Tokens JWT](#tokens-jwt)
- [Seguridad](#seguridad)
- [Casos de Uso](#casos-de-uso)
- [Consideraciones Técnicas](#consideraciones-técnicas)

---

## Descripción General

El módulo de autenticación proporciona un sistema completo de login basado en **JWT (JSON Web Tokens)** con soporte para refresh tokens. Permite a los usuarios autenticarse de forma segura y mantener sesiones activas sin necesidad de enviar credenciales en cada request.

### Características Principales

- ✅ **Autenticación con JWT**
- ✅ **Refresh Tokens** para renovar sesiones
- ✅ **Encriptación de contraseñas** con bcrypt
- ✅ **Expiración configurable** de tokens
- ✅ **Logout con revocación** de tokens
- ✅ **Endpoint de perfil** de usuario autenticado

### Estado

🟢 **Implementado y Funcional**

---

## Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **jsonwebtoken** | 9.0.2 | Generación y verificación de JWT |
| **bcrypt** | 6.0.0 | Hash de contraseñas |
| **express** | 5.1.x | Framework web |
| **class-validator** | 0.14.2 | Validación de DTOs |

---

## Flujo de Autenticación

### 1. Login Inicial

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as Backend
    participant DB as PostgreSQL

    C->>API: POST /auth/login<br/>{email, password}
    API->>DB: SELECT user WHERE email
    DB-->>API: User data
    API->>API: bcrypt.compare(password, passwordHash)
    alt Password válido
        API->>API: Generar Access Token (3h)
        API->>API: Generar Refresh Token (7d)
        API-->>C: {accessToken, refreshToken, user}
    else Password inválido
        API-->>C: 401 Unauthorized
    end
```

### 2. Request Autenticado

```mermaid
sequenceDiagram
    participant C as Cliente
    participant MW as Auth Middleware
    participant API as Backend

    C->>MW: GET /api/resource<br/>Authorization: Bearer {token}
    MW->>MW: jwt.verify(token, SECRET)
    alt Token válido
        MW->>API: req.user = decoded user
        API-->>C: 200 OK {data}
    else Token inválido/expirado
        MW-->>C: 401 Unauthorized
    end
```

### 3. Refresh Token

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as Backend

    C->>API: POST /auth/refresh-token<br/>{refreshToken}
    API->>API: jwt.verify(refreshToken, REFRESH_SECRET)
    alt Refresh Token válido
        API->>API: Generar nuevo Access Token
        API->>API: Generar nuevo Refresh Token
        API-->>C: {accessToken, refreshToken}
    else Refresh Token inválido
        API-->>C: 401 Unauthorized
    end
```

---

## Componentes del Módulo

### 1. AuthController (`controllers/auth.controller.ts`)

Maneja las peticiones HTTP de autenticación.

**Métodos:**

```typescript
class AuthController {
  /**
   * Login de usuario
   * @route POST /auth/login
   */
  async login(req: Request, res: Response): Promise<void>
  
  /**
   * Renovar access token
   * @route POST /auth/refresh-token
   */
  async refreshToken(req: Request, res: Response): Promise<void>
}
```

**Responsabilidades:**
- Validar credenciales
- Generar tokens JWT
- Manejar errores de autenticación
- Devolver información del usuario

---

### 2. AuthService (`services/auth.service.ts`)

Contiene la lógica de negocio de autenticación.

**Métodos:**

```typescript
class AuthService {
  /**
   * Validar credenciales y generar tokens
   */
  async login(email: string, password: string): Promise<AuthResponse>
  
  /**
   * Verificar y renovar refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse>
  
  /**
   * Generar access token para un usuario
   */
  generateAccessToken(user: User): string
  
  /**
   * Generar refresh token para un usuario
   */
  generateRefreshToken(user: User): string
  
  /**
   * Verificar contraseña
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>
}
```

---

### 3. Auth Middleware (`middlewares/auth.middleware.ts`)

Middleware para proteger rutas que requieren autenticación.

**Implementación:**

```typescript
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extraer token del header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // 3. Buscar usuario en BD
    const user = await dataSource.getRepository(User).findOne({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // 4. Agregar usuario a request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

**Uso:**

```typescript
// Proteger una ruta
router.get('/protected', authenticate, controller.action);
```

---

### 4. DTOs de Autenticación (`dtos/user.dto.ts`)

#### UserLoginDto

```typescript
export class UserLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
```

#### UserTokenRefreshDto

```typescript
export class UserTokenRefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

---

### 5. Tipos e Interfaces (`types/index.ts`)

```typescript
// Payload del JWT
export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}

// Request extendido con usuario
export interface AuthRequest extends Request {
  user?: User;
}

// Respuesta de autenticación
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    lastName: string;
    role: UserRole;
  };
}

// Respuesta de refresh token
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
```

---

## Endpoints

### POST /auth/login

Autentica un usuario y devuelve tokens de acceso.

**Request:**
```json
POST /auth/login
Content-Type: application/json

{
  "email": "admin@tejadahnos.com",
  "password": "admin123"
}
```

**Response Success (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "email": "admin@tejadahnos.com",
    "name": "Admin",
    "lastName": "Sistema",
    "role": "ADMIN"
  }
}
```

**Response Error (401):**
```json
{
  "message": "Credenciales inválidas"
}
```

**Response Error (400):**
```json
{
  "message": "Errores de validación",
  "errors": [
    {
      "field": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

---

### POST /auth/refresh-token

Renueva el access token usando un refresh token válido.

**Request:**
```json
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error (401):**
```json
{
  "message": "Refresh token inválido o expirado"
}
```

---

### GET /auth/profile

Obtiene el perfil del usuario autenticado.

**Request:**
```
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Success (200):**
```json
{
  "id": "uuid-del-usuario",
  "email": "admin@tejadahnos.com",
  "name": "Admin",
  "lastName": "Sistema",
  "role": "ADMIN",
  "hourlyRate": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Response Error (401):**
```json
{
  "message": "No autenticado"
}
```

---

## Tokens JWT

### Access Token

**Duración:** 3 horas  
**Secret:** `process.env.JWT_SECRET`  
**Propósito:** Autenticar requests a la API

**Payload:**
```json
{
  "userId": "uuid-del-usuario",
  "role": "ADMIN",
  "email": "admin@tejadahnos.com",
  "iat": 1704067200,
  "exp": 1704078000
}
```

**Generación:**
```typescript
const accessToken = jwt.sign(
  {
    userId: user.id,
    role: user.role,
    email: user.email
  },
  process.env.JWT_SECRET!,
  { expiresIn: process.env.JWT_EXPIRES_IN || '3h' }
);
```

---

### Refresh Token

**Duración:** 7 días  
**Secret:** `process.env.JWT_REFRESH_SECRET`  
**Propósito:** Renovar access tokens sin re-autenticación

**Payload:**
```json
{
  "userId": "uuid-del-usuario",
  "iat": 1704067200,
  "exp": 1704672000
}
```

**Generación:**
```typescript
const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_REFRESH_SECRET!,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
);
```

---

## Seguridad

### 1. Encriptación de Contraseñas

Las contraseñas se almacenan hasheadas con **bcrypt** (10 rounds):

```typescript
// Al crear/actualizar usuario
const passwordHash = await bcrypt.hash(password, 10);

// Al verificar login
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**⚠️ Importante:**
- El campo `passwordHash` tiene `select: false` en la entidad
- Nunca se expone en respuestas de la API
- Solo se usa internamente para validación

---

### 2. Variables de Entorno

```bash
# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here_change_in_production

# Duraciones
JWT_EXPIRES_IN=3h
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ Importante:**
- Usar secrets largos y aleatorios en producción
- Nunca commitear secrets reales en el repositorio
- Rotar secrets periódicamente

---

### 3. Validaciones

- Email debe ser formato válido
- Password mínimo 6 caracteres
- Tokens verificados en cada request
- Usuario debe existir y estar activo

---

### 4. Headers HTTP

```typescript
// CORS configurado
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Headers de seguridad
app.use(helmet());
```

---

## Casos de Uso

### Caso 1: Login de Usuario

**Actor:** Usuario (ADMIN/CAPATAZ/OPERARIO)

**Precondiciones:**
- Usuario registrado en el sistema
- Credenciales correctas

**Flujo:**
1. Usuario ingresa email y password
2. Frontend envía POST /auth/login
3. Backend valida credenciales
4. Backend genera tokens
5. Frontend recibe y almacena tokens
6. Frontend redirige a dashboard

**Postcondiciones:**
- Usuario autenticado
- Tokens almacenados en cliente
- Sesión activa

---

### Caso 2: Request Autenticado

**Actor:** Cliente autenticado

**Precondiciones:**
- Usuario previamente autenticado
- Access token válido

**Flujo:**
1. Cliente necesita acceder a recurso protegido
2. Cliente envía request con header `Authorization: Bearer {token}`
3. Middleware `authenticate` verifica token
4. Request procede con `req.user` disponible
5. Endpoint retorna datos

---

### Caso 3: Renovación de Token

**Actor:** Cliente con token expirado

**Precondiciones:**
- Access token expirado
- Refresh token válido

**Flujo:**
1. Cliente recibe 401 en request
2. Cliente envía POST /auth/refresh-token con refresh token
3. Backend verifica refresh token
4. Backend genera nuevos tokens
5. Cliente actualiza tokens almacenados
6. Cliente reintenta request original

---

### Caso 4: Logout

**Actor:** Usuario autenticado

**Flujo:**
1. Usuario solicita cerrar sesión
2. Frontend elimina tokens del almacenamiento
3. Frontend redirige a login
4. Tokens quedan invalidados en cliente

**Nota:** Actualmente el logout es solo del lado del cliente. Para logout del lado del servidor, se necesitaría implementar:
- Lista negra de tokens (Redis)
- O invalidación de refresh tokens en BD

---

## Consideraciones Técnicas

### 1. Almacenamiento de Tokens en Cliente

**Opciones:**

| Método | Seguridad | Persistencia | Recomendado |
|--------|-----------|--------------|-------------|
| localStorage | Media | Sí | ⚠️ Vulnerable a XSS |
| sessionStorage | Media | No | ⚠️ Vulnerable a XSS |
| httpOnly Cookie | Alta | Sí | ✅ Más seguro |
| Memory | Alta | No | ✅ Muy seguro, no persiste |

**Recomendación:**
- Access token: Memory o httpOnly cookie
- Refresh token: httpOnly cookie

---

### 2. Manejo de Expiración

```typescript
// En frontend
try {
  const response = await api.get('/resource');
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    // Intentar renovar token
    const newTokens = await api.post('/auth/refresh-token', {
      refreshToken: getRefreshToken()
    });
    
    // Guardar nuevos tokens
    saveTokens(newTokens.data);
    
    // Reintentar request original
    return api.get('/resource');
  }
  throw error;
}
```

---

### 3. Revocación de Tokens (Futuro)

Para implementar logout del lado del servidor:

**Opción 1: Lista Negra (Redis)**
```typescript
// Al hacer logout
await redis.setex(`blacklist:${token}`, expirationTime, 'revoked');

// En middleware
const isBlacklisted = await redis.exists(`blacklist:${token}`);
if (isBlacklisted) {
  return res.status(401).json({ message: 'Token revocado' });
}
```

**Opción 2: Tokens en Base de Datos**
```typescript
// Tabla refresh_tokens
{
  id: uuid,
  userId: uuid,
  token: string,
  expiresAt: timestamp,
  isRevoked: boolean
}
```

---

### 4. Rate Limiting en Login

Para prevenir ataques de fuerza bruta:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);
```

---

### 5. Logging de Eventos de Seguridad

Eventos importantes a registrar:
- ✅ Login exitoso
- ✅ Login fallido (password incorrecto)
- ✅ Token expirado
- ✅ Token inválido
- ✅ Refresh token usado
- ✅ Múltiples intentos fallidos

```typescript
logger.info('Login exitoso', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.warn('Login fallido', {
  email: req.body.email,
  ip: req.ip,
  reason: 'Password incorrecto'
});
```

---

## Testing

### Test de Login Exitoso

```typescript
describe('POST /auth/login', () => {
  it('should return tokens on valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@tejadahnos.com',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user.email).toBe('admin@tejadahnos.com');
  });
});
```

### Test de Login Fallido

```typescript
it('should return 401 on invalid credentials', async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: 'admin@tejadahnos.com',
      password: 'wrongpassword'
    });
  
  expect(response.status).toBe(401);
  expect(response.body.message).toBe('Credenciales inválidas');
});
```

---

## Mejoras Futuras

- [ ] Implementar logout con revocación de tokens
- [ ] 2FA (Two-Factor Authentication)
- [ ] OAuth2 / Social login
- [ ] Password reset por email
- [ ] Historial de sesiones activas
- [ ] Detección de sesiones concurrentes
- [ ] IP whitelisting para usuarios sensibles

---

**Documentación relacionada:**
- [ROLES_PERMISOS.md](../ROLES_PERMISOS.md) - Sistema de autorización
- [API: endpoints-auth.md](../API/endpoints-auth.md) - Documentación completa de endpoints
- [Módulo de Usuarios](./02-USUARIOS.md) - Gestión de usuarios
