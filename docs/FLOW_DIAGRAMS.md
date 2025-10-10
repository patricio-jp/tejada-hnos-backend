# Diagramas del Sistema de Autenticación JWT

## 🔄 Flujo de Autenticación Completo

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /auth/login
       │ { email, password }
       ▼
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │
         │ 2. Validar datos
         ▼
┌──────────────────┐
│   AuthService    │
└────────┬─────────┘
         │
         │ 3. Buscar usuario en BD
         │ 4. Comparar password hash
         ▼
┌──────────────────┐
│    Database      │
│   (PostgreSQL)   │
└────────┬─────────┘
         │
         │ 5. Usuario encontrado
         ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ 6. Generar tokens│
│  - Access Token  │
│  - Refresh Token │
└────────┬─────────┘
         │
         │ 7. Guardar refresh token en BD
         ▼
┌──────────────────┐
│    Database      │
└────────┬─────────┘
         │
         │ 8. Tokens guardados
         ▼
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │
         │ 9. Devolver respuesta
         │ { accessToken, refreshToken, user }
         ▼
┌─────────────┐
│   Cliente   │
│             │
│ Guarda      │
│ tokens      │
└─────────────┘
```

## 🔐 Flujo de Petición Autenticada

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. GET /users
       │ Authorization: Bearer <access_token>
       ▼
┌──────────────────────┐
│ authenticate         │
│ (Middleware)         │
└──────┬───────────────┘
       │
       │ 2. Extraer token del header
       │ 3. Verificar firma y expiración
       ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ jwt.verify()     │
└────────┬─────────┘
         │
         │ Token válido
         │ 4. Decodificar payload
         │ { userId, email, role }
         ▼
┌──────────────────────┐
│ Request.user = {...} │
└──────┬───────────────┘
       │
       │ 5. Continuar al controlador
       ▼
┌──────────────────┐
│  UserController  │
│                  │
│ Acceso al usuario│
│ desde req.user   │
└────────┬─────────┘
         │
         │ 6. Procesar petición
         │ 7. Devolver respuesta
         ▼
┌─────────────┐
│   Cliente   │
└─────────────┘
```

## 🛡️ Flujo de Autorización por Rol

```
┌─────────────┐
│   Cliente   │
│   (OPERARIO)│
└──────┬──────┘
       │
       │ 1. POST /admin/users
       │ Authorization: Bearer <token>
       ▼
┌──────────────────────┐
│ authenticate         │
└──────┬───────────────┘
       │ Token válido
       │ req.user = { role: 'OPERARIO' }
       ▼
┌──────────────────────┐
│ authorize(ADMIN)     │
│ (Middleware)         │
└──────┬───────────────┘
       │
       │ 2. Verificar req.user.role
       │ 3. Comparar con roles permitidos
       │
       │ OPERARIO !== ADMIN
       ▼
┌──────────────────────┐
│ 403 Forbidden        │
│                      │
│ "No tienes permisos" │
└──────┬───────────────┘
       │
       ▼
┌─────────────┐
│   Cliente   │
│   Error 403 │
└─────────────┘


┌─────────────┐
│   Cliente   │
│   (ADMIN)   │
└──────┬──────┘
       │
       │ 1. POST /admin/users
       │ Authorization: Bearer <token>
       ▼
┌──────────────────────┐
│ authenticate         │
└──────┬───────────────┘
       │ Token válido
       │ req.user = { role: 'ADMIN' }
       ▼
┌──────────────────────┐
│ authorize(ADMIN)     │
└──────┬───────────────┘
       │
       │ ADMIN === ADMIN ✓
       │ Autorizado
       ▼
┌──────────────────┐
│  Controller      │
│  Procesa petición│
└────────┬─────────┘
         │
         │ Respuesta exitosa
         ▼
┌─────────────┐
│   Cliente   │
└─────────────┘
```

## 🔄 Flujo de Refresh Token

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ Access token expirado
       │
       │ 1. POST /auth/refresh
       │ { refreshToken }
       ▼
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │
         │ 2. Validar refresh token
         ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ jwt.verify()     │
└────────┬─────────┘
         │
         │ 3. Buscar en BD
         ▼
┌──────────────────┐
│    Database      │
│                  │
│ Buscar token     │
│ Verificar:       │
│  - No revocado   │
│  - No expirado   │
└────────┬─────────┘
         │
         │ Token válido
         ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ 4. Revocar token │
│    anterior      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Database      │
│                  │
│ UPDATE revoked   │
│ = true           │
└────────┬─────────┘
         │
         │ 5. Generar nuevos tokens
         ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ - Nuevo access   │
│ - Nuevo refresh  │
└────────┬─────────┘
         │
         │ 6. Guardar nuevo refresh token
         ▼
┌──────────────────┐
│    Database      │
└────────┬─────────┘
         │
         │ 7. Devolver tokens
         ▼
┌─────────────┐
│   Cliente   │
│             │
│ Actualiza   │
│ tokens      │
└─────────────┘
```

## 🚪 Flujo de Logout

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /auth/logout
       │ { refreshToken }
       ▼
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │
         │ 2. Buscar refresh token
         ▼
┌──────────────────┐
│    Database      │
│                  │
│ SELECT * FROM    │
│ refresh_tokens   │
│ WHERE token = ?  │
└────────┬─────────┘
         │
         │ Token encontrado
         ▼
┌──────────────────┐
│   AuthService    │
│                  │
│ 3. Revocar token │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Database      │
│                  │
│ UPDATE           │
│ SET revoked=true │
└────────┬─────────┘
         │
         │ 4. Confirmación
         ▼
┌──────────────────┐
│  AuthController  │
└────────┬─────────┘
         │
         │ 5. Respuesta exitosa
         ▼
┌─────────────┐
│   Cliente   │
│             │
│ Elimina     │
│ tokens      │
│ localmente  │
└─────────────┘
```

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (Frontend)                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Login Form  │  │  Auth Context│  │  API Service │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/HTTPS
                         │ Authorization: Bearer <token>
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              MIDDLEWARES                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │ │
│  │  │express.json()│  │ authenticate │  │authorize│ │ │
│  │  └──────────────┘  └──────────────┘  └─────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   ROUTES                           │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │  /auth/*     │  │  /users/*    │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │               CONTROLLERS                          │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │AuthController│  │UserController│               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │                 SERVICES                           │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │ AuthService  │  │ UserService  │               │ │
│  │  │              │  │              │               │ │
│  │  │ - login()    │  │ - getAll()   │               │ │
│  │  │ - register() │  │ - create()   │               │ │
│  │  │ - refresh()  │  │              │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
│                         │                                │
│                         ▼                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │              DATABASE SERVICE                      │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │           TypeORM DataSource               │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ SQL Queries
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL DATABASE                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    users     │  │refresh_tokens│  │    plots     │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │ id           │  │ id           │  │ id           │  │
│  │ email        │  │ token        │  │ ...          │  │
│  │ passwordHash │  │ userId       │  └──────────────┘  │
│  │ role         │  │ expiresAt    │                     │
│  │ ...          │  │ revoked      │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

## 📦 Estructura de Datos

### Access Token Payload
```json
{
  "userId": "uuid-string",
  "email": "user@example.com",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234578690
}
```

### Refresh Token Payload
```json
{
  "userId": "uuid-string",
  "email": "user@example.com",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Refresh Token en BD
```typescript
{
  id: "uuid",
  token: "eyJhbGciOiJIUzI1NiIs...",
  userId: "uuid-del-usuario",
  expiresAt: Date,
  createdAt: Date,
  revoked: false
}
```

## 🔐 Capas de Seguridad

```
┌─────────────────────────────────────────────────┐
│         Capa 1: Contraseña Hasheada             │
│              bcrypt con 10 rounds               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Capa 2: JWT Firmado                     │
│         Secret key + algoritmo HS256            │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Capa 3: Token Expiration                │
│         Access: 3h, Refresh: 7d                 │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Capa 4: Refresh Token en BD             │
│         Validación de revocación                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│         Capa 5: Middleware de Autorización      │
│         Validación de roles                     │
└─────────────────────────────────────────────────┘
```

## ⏱️ Timeline de Tokens

```
Login
  │
  ├─ Access Token generado (válido 3 horas)
  │  │
  │  ├─ Hora 0: Token válido ✓
  │  ├─ Hora 1: Token válido ✓
  │  ├─ Hora 2: Token válido ✓
  │  ├─ Hora 3: Token EXPIRADO ✗
  │  └─ Requiere refresh
  │
  └─ Refresh Token generado (válido 7 días)
     │
     ├─ Día 1-6: Token válido ✓
     ├─ Día 7: Token válido ✓
     ├─ Día 8: Token EXPIRADO ✗
     └─ Requiere nuevo login
```
