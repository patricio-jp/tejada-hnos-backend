# 🔐 API - Autenticación

## Índice
- [Endpoints](#endpoints)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/refresh](#post-authrefresh)
  - [POST /auth/logout](#post-authlogout)
  - [GET /auth/me](#get-authme)
- [Flujos Completos](#flujos-completos)
- [Códigos de Error](#códigos-de-error)

---

## Endpoints

### POST /auth/login

Autenticar usuario y obtener tokens JWT.

**URL:** `/auth/login`

**Método:** `POST`

**Autorización:** No requiere

**Body:**
```json
{
  "email": "admin@tejadahnos.com",
  "password": "Admin123!@#"
}
```

**Validaciones:**
- `email` (string, required, email format)
- `password` (string, required, min: 8 chars)

**Response (200) - Success:**
```json
{
  "user": {
    "id": "user-uuid-1",
    "email": "admin@tejadahnos.com",
    "name": "Administrador Principal",
    "role": "ADMIN",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 10800
  }
}
```

**Estructura de Tokens:**

*Access Token Payload:*
```json
{
  "userId": "user-uuid-1",
  "email": "admin@tejadahnos.com",
  "role": "ADMIN",
  "iat": 1737820800,
  "exp": 1737831600
}
```

*Refresh Token Payload:*
```json
{
  "userId": "user-uuid-1",
  "type": "refresh",
  "iat": 1737820800,
  "exp": 1738425600
}
```

---

**Response (401) - Credenciales inválidas:**
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

---

**Response (400) - Validación fallida:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

**cURL:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tejadahnos.com",
    "password": "Admin123!@#"
  }'
```

---

**TypeScript Client:**
```typescript
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  
  // Guardar tokens
  localStorage.setItem('accessToken', data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.tokens.refreshToken);
  
  return data.user;
};

// Uso
try {
  const user = await login('admin@tejadahnos.com', 'Admin123!@#');
  console.log('Logged in:', user.name);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

### POST /auth/refresh

Renovar access token usando refresh token.

**URL:** `/auth/refresh`

**Método:** `POST`

**Autorización:** No requiere

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validaciones:**
- `refreshToken` (string, required)

**Response (200) - Success:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 10800
}
```

---

**Response (401) - Refresh token inválido:**
```json
{
  "statusCode": 401,
  "message": "Token de actualización inválido o expirado",
  "error": "Unauthorized"
}
```

---

**cURL:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

**TypeScript Client:**
```typescript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }
  
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  if (!response.ok) {
    // Refresh token expirado o inválido
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return;
  }
  
  const data = await response.json();
  
  // Actualizar access token
  localStorage.setItem('accessToken', data.accessToken);
  
  return data.accessToken;
};

// Interceptor para renovar automáticamente
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Si access token expiró, renovar y reintentar
  if (response.status === 401) {
    token = await refreshAccessToken();
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  return response;
};
```

---

### POST /auth/logout

Cerrar sesión (invalidar tokens).

**URL:** `/auth/logout`

**Método:** `POST`

**Autorización:** Bearer token

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) - Success:**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

**cURL:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

**TypeScript Client:**
```typescript
const logout = async () => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Limpiar tokens locales
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Redirigir a login
  window.location.href = '/login';
};
```

---

### GET /auth/me

Obtener datos del usuario autenticado.

**URL:** `/auth/me`

**Método:** `GET`

**Autorización:** Bearer token

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200) - Success:**
```json
{
  "id": "user-uuid-1",
  "email": "admin@tejadahnos.com",
  "name": "Administrador Principal",
  "role": "ADMIN",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Response (200) - CAPATAZ with fields:**
```json
{
  "id": "capataz-uuid-1",
  "email": "juan.perez@tejadahnos.com",
  "name": "Juan Pérez",
  "role": "CAPATAZ",
  "managedFields": [
    {
      "id": "field-uuid-1",
      "name": "Campo Norte",
      "location": "Mendoza - Luján de Cuyo",
      "totalArea": 50.00
    }
  ],
  "createdAt": "2024-01-20T08:00:00.000Z",
  "updatedAt": "2024-01-20T08:00:00.000Z"
}
```

---

**Response (401) - No autenticado:**
```json
{
  "statusCode": 401,
  "message": "Token no proporcionado",
  "error": "Unauthorized"
}
```

---

**cURL:**
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

**TypeScript Client:**
```typescript
const getCurrentUser = async () => {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch('http://localhost:3000/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get current user');
  }
  
  return response.json();
};

// Uso
const user = await getCurrentUser();
console.log('Current user:', user.name, '-', user.role);

if (user.role === 'CAPATAZ' && user.managedFields?.length > 0) {
  console.log('Manages fields:', user.managedFields.map(f => f.name).join(', '));
}
```

---

## Flujos Completos

### Flujo 1: Login Completo

```typescript
/**
 * Flujo completo de autenticación
 */
class AuthService {
  private baseUrl = 'http://localhost:3000';
  
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    // Guardar tokens
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    
    // Guardar usuario
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }
  
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token');
    }
    
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      this.logout();
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    
    return data.accessToken;
  }
  
  async logout() {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
}

const authService = new AuthService();
export default authService;
```

---

### Flujo 2: HTTP Client con Interceptor

```typescript
/**
 * Cliente HTTP con renovación automática de tokens
 */
class ApiClient {
  private baseUrl = 'http://localhost:3000';
  
  async request(endpoint: string, options: RequestInit = {}) {
    let token = localStorage.getItem('accessToken');
    
    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    
    // Si access token expiró (401), renovar y reintentar
    if (response.status === 401) {
      try {
        token = await this.refreshToken();
        
        // Reintentar request original
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // Refresh falló, redirigir a login
        window.location.href = '/login';
        throw error;
      }
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
  
  private async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    
    return data.accessToken;
  }
  
  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
  
  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  
  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
export default apiClient;

// Uso
const fields = await apiClient.get('/fields');
const newField = await apiClient.post('/fields', { name: 'Campo Sur', ... });
```

---

### Flujo 3: React Hook (useAuth)

```typescript
import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Verificar si hay sesión activa
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    
    setUser(data.user);
  };
  
  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      try {
        await fetch('http://localhost:3000/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Uso en componente
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      // Redirigir a dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit">Login</button>
    </form>
  );
}

// Protected Route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  
  return <>{children}</>;
}
```

---

## Códigos de Error

| Código | Descripción | Causa |
|--------|-------------|-------|
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Credenciales incorrectas o token inválido/expirado |
| 403 | Forbidden | No tiene permisos (usado en otros endpoints) |
| 404 | Not Found | Usuario no existe |
| 500 | Internal Server Error | Error del servidor |

---

### Ejemplos de Errores

**400 - Validación fallida:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

**401 - Credenciales inválidas:**
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

**401 - Token expirado:**
```json
{
  "statusCode": 401,
  "message": "Token expirado",
  "error": "Unauthorized"
}
```

**401 - Token inválido:**
```json
{
  "statusCode": 401,
  "message": "Token inválido",
  "error": "Unauthorized"
}
```

**401 - No token:**
```json
{
  "statusCode": 401,
  "message": "Token no proporcionado",
  "error": "Unauthorized"
}
```

---

**Documentación relacionada:**
- [01-AUTENTICACION.md](../MODULOS/01-AUTENTICACION.md) - Módulo de autenticación completo
- [endpoints-usuarios.md](./endpoints-usuarios.md) - Gestión de usuarios
- [ROLES_PERMISOS.md](../ROLES_PERMISOS.md) - Roles y permisos del sistema
