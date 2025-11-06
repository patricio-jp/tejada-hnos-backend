# 👥 API - Usuarios

## Índice
- [Endpoints](#endpoints)
  - [GET /users](#get-users)
  - [GET /users/:id](#get-usersid)
  - [POST /users](#post-users)
  - [PUT /users/:id](#put-usersid)
  - [DELETE /users/:id](#delete-usersid)
  - [PUT /users/:id/change-password](#put-usersidchange-password)
- [Permisos por Rol](#permisos-por-rol)
- [Ejemplos Completos](#ejemplos-completos)

---

## Endpoints

### GET /users

Listar todos los usuarios del sistema.

**URL:** `/users`

**Método:** `GET`

**Autorización:** Bearer token (ADMIN)

**Query Parameters:**
- `role` (string, optional) - Filtrar por rol: ADMIN | CAPATAZ | OPERARIO
- `page` (number, optional) - Número de página (default: 1)
- `limit` (number, optional) - Resultados por página (default: 10)

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

**Request Example 1 - Todos los usuarios:**
```
GET /users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "email": "admin@tejadahnos.com",
      "name": "Administrador Principal",
      "role": "ADMIN",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "capataz-uuid-1",
      "email": "juan.perez@tejadahnos.com",
      "name": "Juan Pérez",
      "role": "CAPATAZ",
      "managedFields": [
        {
          "id": "field-uuid-1",
          "name": "Campo Norte"
        }
      ],
      "createdAt": "2024-01-20T08:00:00.000Z",
      "updatedAt": "2024-01-20T08:00:00.000Z"
    },
    {
      "id": "operario-uuid-1",
      "email": "pedro.gonzalez@tejadahnos.com",
      "name": "Pedro González",
      "role": "OPERARIO",
      "createdAt": "2024-01-25T09:15:00.000Z",
      "updatedAt": "2024-01-25T09:15:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

**Request Example 2 - Filtrar por rol:**
```
GET /users?role=CAPATAZ
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "capataz-uuid-1",
      "email": "juan.perez@tejadahnos.com",
      "name": "Juan Pérez",
      "role": "CAPATAZ",
      "managedFields": [
        {
          "id": "field-uuid-1",
          "name": "Campo Norte"
        }
      ],
      "createdAt": "2024-01-20T08:00:00.000Z",
      "updatedAt": "2024-01-20T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

**Response (403) - No es ADMIN:**
```json
{
  "statusCode": 403,
  "message": "No tiene permisos para acceder a este recurso",
  "error": "Forbidden"
}
```

---

**cURL:**
```bash
# Listar todos
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer {token}"

# Filtrar por rol
curl -X GET "http://localhost:3000/users?role=CAPATAZ" \
  -H "Authorization: Bearer {token}"

# Con paginación
curl -X GET "http://localhost:3000/users?page=2&limit=5" \
  -H "Authorization: Bearer {token}"
```

---

**TypeScript Client:**
```typescript
const getUsers = async (filters?: { role?: string; page?: number; limit?: number }) => {
  const params = new URLSearchParams();
  
  if (filters?.role) params.append('role', filters.role);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const url = `/users${params.toString() ? '?' + params.toString() : ''}`;
  
  return apiClient.get(url);
};

// Uso
const allUsers = await getUsers();
const capataces = await getUsers({ role: 'CAPATAZ' });
const page2 = await getUsers({ page: 2, limit: 5 });
```

---

### GET /users/:id

Obtener un usuario específico por ID.

**URL:** `/users/:id`

**Método:** `GET`

**Autorización:** Bearer token (ADMIN)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```
GET /users/capataz-uuid-1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200) - Usuario CAPATAZ:**
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
      "totalArea": 50.00,
      "plots": [
        {
          "id": "plot-uuid-1",
          "plotNumber": "N-01",
          "area": 10.00
        }
      ]
    }
  ],
  "createdAt": "2024-01-20T08:00:00.000Z",
  "updatedAt": "2024-01-20T08:00:00.000Z"
}
```

**Response (200) - Usuario ADMIN:**
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

---

**Response (404) - Usuario no existe:**
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado",
  "error": "Not Found"
}
```

---

**cURL:**
```bash
curl -X GET http://localhost:3000/users/capataz-uuid-1 \
  -H "Authorization: Bearer {token}"
```

---

### POST /users

Crear un nuevo usuario.

**URL:** `/users`

**Método:** `POST`

**Autorización:** Bearer token (ADMIN)

**Body:**
```json
{
  "email": "nuevo.capataz@tejadahnos.com",
  "name": "Carlos Rodríguez",
  "password": "SecurePass123!",
  "role": "CAPATAZ",
  "fieldIds": ["field-uuid-2"]
}
```

**Validaciones:**
- `email` (string, required, email, unique)
- `name` (string, required, min: 2)
- `password` (string, required, min: 8)
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
  - Al menos 1 símbolo especial
- `role` (enum, required) - ADMIN | CAPATAZ | OPERARIO
- `fieldIds` (array of UUIDs, optional) - Solo para CAPATAZ

**Response (201) - Success:**
```json
{
  "id": "new-capataz-uuid",
  "email": "nuevo.capataz@tejadahnos.com",
  "name": "Carlos Rodríguez",
  "role": "CAPATAZ",
  "managedFields": [
    {
      "id": "field-uuid-2",
      "name": "Campo Sur"
    }
  ],
  "createdAt": "2025-02-01T10:00:00.000Z",
  "updatedAt": "2025-02-01T10:00:00.000Z"
}
```

---

**Response (400) - Email duplicado:**
```json
{
  "statusCode": 400,
  "message": "El email ya está en uso",
  "error": "Bad Request"
}
```

---

**Response (400) - Validación fallida:**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be stronger",
    "role must be one of: ADMIN, CAPATAZ, OPERARIO"
  ],
  "error": "Bad Request"
}
```

---

**cURL:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.capataz@tejadahnos.com",
    "name": "Carlos Rodríguez",
    "password": "SecurePass123!",
    "role": "CAPATAZ",
    "fieldIds": ["field-uuid-2"]
  }'
```

---

**TypeScript Client:**
```typescript
interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'CAPATAZ' | 'OPERARIO';
  fieldIds?: string[];
}

const createUser = async (data: CreateUserDto) => {
  return apiClient.post('/users', data);
};

// Uso - Crear CAPATAZ
const newCapataz = await createUser({
  email: 'nuevo.capataz@tejadahnos.com',
  name: 'Carlos Rodríguez',
  password: 'SecurePass123!',
  role: 'CAPATAZ',
  fieldIds: ['field-uuid-2']
});

// Uso - Crear OPERARIO
const newOperario = await createUser({
  email: 'nuevo.operario@tejadahnos.com',
  name: 'Luis Martínez',
  password: 'SecurePass123!',
  role: 'OPERARIO'
});
```

---

### PUT /users/:id

Actualizar un usuario existente.

**URL:** `/users/:id`

**Método:** `PUT`

**Autorización:** Bearer token (ADMIN)

**Body:**
```json
{
  "name": "Juan Pérez Actualizado",
  "role": "CAPATAZ",
  "fieldIds": ["field-uuid-1", "field-uuid-3"]
}
```

**Validaciones:**
- `email` (string, optional, email, unique)
- `name` (string, optional, min: 2)
- `role` (enum, optional) - ADMIN | CAPATAZ | OPERARIO
- `fieldIds` (array of UUIDs, optional) - Solo relevante para CAPATAZ

**Request:**
```
PUT /users/capataz-uuid-1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Juan Pérez Actualizado",
  "fieldIds": ["field-uuid-1", "field-uuid-3"]
}
```

**Response (200) - Success:**
```json
{
  "id": "capataz-uuid-1",
  "email": "juan.perez@tejadahnos.com",
  "name": "Juan Pérez Actualizado",
  "role": "CAPATAZ",
  "managedFields": [
    {
      "id": "field-uuid-1",
      "name": "Campo Norte"
    },
    {
      "id": "field-uuid-3",
      "name": "Campo Este"
    }
  ],
  "createdAt": "2024-01-20T08:00:00.000Z",
  "updatedAt": "2025-02-01T11:00:00.000Z"
}
```

---

**Response (404) - Usuario no existe:**
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado",
  "error": "Not Found"
}
```

---

**cURL:**
```bash
curl -X PUT http://localhost:3000/users/capataz-uuid-1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez Actualizado",
    "fieldIds": ["field-uuid-1", "field-uuid-3"]
  }'
```

---

**TypeScript Client:**
```typescript
interface UpdateUserDto {
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'CAPATAZ' | 'OPERARIO';
  fieldIds?: string[];
}

const updateUser = async (userId: string, data: UpdateUserDto) => {
  return apiClient.put(`/users/${userId}`, data);
};

// Uso - Actualizar nombre
await updateUser('capataz-uuid-1', {
  name: 'Juan Pérez Actualizado'
});

// Uso - Cambiar rol de OPERARIO a CAPATAZ
await updateUser('operario-uuid-1', {
  role: 'CAPATAZ',
  fieldIds: ['field-uuid-2']
});

// Uso - Agregar campos a CAPATAZ
await updateUser('capataz-uuid-1', {
  fieldIds: ['field-uuid-1', 'field-uuid-3']
});
```

---

### DELETE /users/:id

Eliminar un usuario (soft delete).

**URL:** `/users/:id`

**Método:** `DELETE`

**Autorización:** Bearer token (ADMIN)

**Request:**
```
DELETE /users/operario-uuid-1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200) - Success:**
```json
{
  "message": "Usuario eliminado exitosamente",
  "id": "operario-uuid-1"
}
```

---

**Response (404) - Usuario no existe:**
```json
{
  "statusCode": 404,
  "message": "Usuario no encontrado",
  "error": "Not Found"
}
```

---

**Response (400) - No se puede eliminar a sí mismo:**
```json
{
  "statusCode": 400,
  "message": "No puede eliminar su propio usuario",
  "error": "Bad Request"
}
```

---

**cURL:**
```bash
curl -X DELETE http://localhost:3000/users/operario-uuid-1 \
  -H "Authorization: Bearer {token}"
```

---

**TypeScript Client:**
```typescript
const deleteUser = async (userId: string) => {
  return apiClient.delete(`/users/${userId}`);
};

// Uso
await deleteUser('operario-uuid-1');
console.log('Usuario eliminado');
```

---

### PUT /users/:id/change-password

Cambiar contraseña de un usuario.

**URL:** `/users/:id/change-password`

**Método:** `PUT`

**Autorización:** Bearer token
- ADMIN puede cambiar cualquier contraseña
- Usuario autenticado puede cambiar su propia contraseña

**Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Validaciones:**
- `currentPassword` (string, required) - Solo si es el propio usuario
- `newPassword` (string, required, min: 8)
  - Al menos 1 mayúscula
  - Al menos 1 minúscula
  - Al menos 1 número
  - Al menos 1 símbolo especial

---

**Request 1 - Usuario cambia su propia contraseña:**
```
PUT /users/operario-uuid-1/change-password
Authorization: Bearer {token del operario}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

**Request 2 - ADMIN cambia contraseña de otro usuario:**
```
PUT /users/operario-uuid-1/change-password
Authorization: Bearer {token del admin}
Content-Type: application/json

{
  "newPassword": "AdminResetPass789!"
}
```

**Response (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

**Response (401) - Contraseña actual incorrecta:**
```json
{
  "statusCode": 401,
  "message": "Contraseña actual incorrecta",
  "error": "Unauthorized"
}
```

---

**Response (403) - No tiene permiso:**
```json
{
  "statusCode": 403,
  "message": "No tiene permisos para cambiar esta contraseña",
  "error": "Forbidden"
}
```

---

**cURL:**
```bash
# Usuario cambia su propia contraseña
curl -X PUT http://localhost:3000/users/operario-uuid-1/change-password \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewSecurePass456!"
  }'

# ADMIN resetea contraseña
curl -X PUT http://localhost:3000/users/operario-uuid-1/change-password \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "AdminResetPass789!"
  }'
```

---

**TypeScript Client:**
```typescript
// Usuario cambia su propia contraseña
const changeOwnPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  return apiClient.put(`/users/${userId}/change-password`, {
    currentPassword,
    newPassword
  });
};

// ADMIN resetea contraseña de otro usuario
const resetUserPassword = async (userId: string, newPassword: string) => {
  return apiClient.put(`/users/${userId}/change-password`, {
    newPassword
  });
};

// Uso
await changeOwnPassword('my-user-id', 'OldPass123!', 'NewSecurePass456!');
await resetUserPassword('operario-uuid-1', 'AdminResetPass789!');
```

---

## Permisos por Rol

| Endpoint | ADMIN | CAPATAZ | OPERARIO |
|----------|-------|---------|----------|
| GET /users | ✅ | ❌ | ❌ |
| GET /users/:id | ✅ | ❌ (solo su propio usuario) | ❌ (solo su propio usuario) |
| POST /users | ✅ | ❌ | ❌ |
| PUT /users/:id | ✅ | ❌ (solo su propio usuario para campos limitados) | ❌ |
| DELETE /users/:id | ✅ | ❌ | ❌ |
| PUT /users/:id/change-password | ✅ (cualquier usuario) | ✅ (solo su propia contraseña) | ✅ (solo su propia contraseña) |

---

## Ejemplos Completos

### Flujo 1: Crear Nuevo Capataz

```typescript
/**
 * Crear un nuevo capataz y asignarle campos
 */
const createCapatazWithFields = async () => {
  // 1. Crear usuario CAPATAZ
  const newCapataz = await apiClient.post('/users', {
    email: 'carlos.rodriguez@tejadahnos.com',
    name: 'Carlos Rodríguez',
    password: 'SecurePass123!',
    role: 'CAPATAZ',
    fieldIds: ['field-uuid-2', 'field-uuid-3']
  });
  
  console.log('✅ Capataz creado:', newCapataz.name);
  console.log('Campos asignados:', newCapataz.managedFields.map(f => f.name));
  
  // 2. Verificar
  const capataz = await apiClient.get(`/users/${newCapataz.id}`);
  console.log('Verificación:', capataz);
  
  return newCapataz;
};
```

---

### Flujo 2: Gestión de Equipo

```typescript
/**
 * ADMIN gestiona equipo de trabajo
 */
class UserManagementService {
  // Crear equipo completo para nuevo campo
  async createFieldTeam(fieldId: string) {
    // Crear capataz
    const capataz = await apiClient.post('/users', {
      email: `capataz.campo${fieldId.slice(0, 4)}@tejadahnos.com`,
      name: 'Capataz Campo Nuevo',
      password: 'TempPass123!',
      role: 'CAPATAZ',
      fieldIds: [fieldId]
    });
    
    // Crear 3 operarios
    const operarios = await Promise.all([1, 2, 3].map(i =>
      apiClient.post('/users', {
        email: `operario${i}.campo${fieldId.slice(0, 4)}@tejadahnos.com`,
        name: `Operario ${i} Campo Nuevo`,
        password: 'TempPass123!',
        role: 'OPERARIO'
      })
    ));
    
    return {
      capataz,
      operarios,
      message: `Equipo creado: 1 capataz y ${operarios.length} operarios`
    };
  }
  
  // Listar usuarios por rol
  async getUsersByRole(role: string) {
    const response = await apiClient.get(`/users?role=${role}`);
    return response.data;
  }
  
  // Transferir campos de un capataz a otro
  async transferFields(fromCapatazId: string, toCapatazId: string, fieldIds: string[]) {
    // Obtener capataz destino
    const toCapataz = await apiClient.get(`/users/${toCapatazId}`);
    const currentFields = toCapataz.managedFields.map(f => f.id);
    
    // Agregar nuevos campos
    await apiClient.put(`/users/${toCapatazId}`, {
      fieldIds: [...currentFields, ...fieldIds]
    });
    
    // Remover campos del capataz origen
    const fromCapataz = await apiClient.get(`/users/${fromCapatazId}`);
    const remainingFields = fromCapataz.managedFields
      .map(f => f.id)
      .filter(id => !fieldIds.includes(id));
    
    await apiClient.put(`/users/${fromCapatazId}`, {
      fieldIds: remainingFields
    });
    
    console.log(`✅ ${fieldIds.length} campos transferidos`);
  }
  
  // Desactivar usuario (eliminar)
  async deactivateUser(userId: string) {
    await apiClient.delete(`/users/${userId}`);
    console.log('✅ Usuario desactivado');
  }
}

const userService = new UserManagementService();

// Uso
const team = await userService.createFieldTeam('field-uuid-new');
const capataces = await userService.getUsersByRole('CAPATAZ');
await userService.transferFields('old-capataz-id', 'new-capataz-id', ['field-1', 'field-2']);
```

---

### Flujo 3: Autogestión de Usuario

```typescript
/**
 * Usuario gestiona su propio perfil
 */
class UserProfileService {
  // Obtener mi perfil
  async getMyProfile() {
    return apiClient.get('/auth/me');
  }
  
  // Actualizar mi nombre (si es permitido)
  async updateMyName(userId: string, newName: string) {
    return apiClient.put(`/users/${userId}`, { name: newName });
  }
  
  // Cambiar mi contraseña
  async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    return apiClient.put(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}

const profileService = new UserProfileService();

// Uso
const myProfile = await profileService.getMyProfile();
console.log('Mi perfil:', myProfile);

await profileService.changeMyPassword(
  myProfile.id,
  'OldPass123!',
  'NewSecurePass456!'
);
console.log('✅ Contraseña actualizada');
```

---

### Flujo 4: React Component - User Management

```typescript
import React, { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadUsers();
  }, [selectedRole]);
  
  const loadUsers = async () => {
    setLoading(true);
    
    try {
      const url = selectedRole ? `/users?role=${selectedRole}` : '/users';
      const response = await apiClient.get(url);
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar usuario?')) return;
    
    try {
      await apiClient.delete(`/users/${userId}`);
      loadUsers();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };
  
  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt('Nueva contraseña (mín. 8 caracteres):');
    if (!newPassword) return;
    
    try {
      await apiClient.put(`/users/${userId}/change-password`, {
        newPassword
      });
      alert('✅ Contraseña actualizada');
    } catch (error) {
      alert('Error al cambiar contraseña');
    }
  };
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      
      <div>
        <label>Filtrar por rol:</label>
        <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
          <option value="">Todos</option>
          <option value="ADMIN">Administradores</option>
          <option value="CAPATAZ">Capataces</option>
          <option value="OPERARIO">Operarios</option>
        </select>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Campos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                {user.managedFields?.map(f => f.name).join(', ') || '-'}
              </td>
              <td>
                <button onClick={() => handleResetPassword(user.id)}>
                  Cambiar contraseña
                </button>
                <button onClick={() => handleDelete(user.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

**Documentación relacionada:**
- [02-USUARIOS.md](../MODULOS/02-USUARIOS.md) - Módulo de usuarios completo
- [endpoints-auth.md](./endpoints-auth.md) - Autenticación
- [ROLES_PERMISOS.md](../ROLES_PERMISOS.md) - Roles y permisos
