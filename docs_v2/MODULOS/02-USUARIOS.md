# 👥 Módulo de Usuarios

## Índice
- [Descripción General](#descripción-general)
- [Entidad User](#entidad-user)
- [Roles del Sistema](#roles-del-sistema)
- [Componentes del Módulo](#componentes-del-módulo)
- [Endpoints](#endpoints)
- [Casos de Uso](#casos-de-uso)
- [Validaciones](#validaciones)
- [Seguridad](#seguridad)

---

## Descripción General

El módulo de usuarios gestiona todos los usuarios del sistema con sus roles y permisos. Permite crear, actualizar, eliminar y consultar usuarios, así como asignar roles específicos (ADMIN, CAPATAZ, OPERARIO).

### Características Principales

- ✅ **CRUD completo de usuarios**
- ✅ **Sistema de roles** (ADMIN, CAPATAZ, OPERARIO)
- ✅ **Encriptación de contraseñas**
- ✅ **Soft delete** (borrado lógico)
- ✅ **Gestión de campos** (CAPATAZ)
- ✅ **Asignación de tareas** (OPERARIO)
- ✅ **Control de acceso por rol**

### Estado

🟢 **Implementado y Funcional**

---

## Entidad User

### Campos

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK, generado automáticamente |
| `email` | varchar | Email del usuario | UNIQUE, NOT NULL |
| `name` | varchar | Nombre | NOT NULL |
| `lastName` | varchar | Apellido | NOT NULL |
| `role` | enum | Rol del usuario | ADMIN \| CAPATAZ \| OPERARIO, DEFAULT: OPERARIO |
| `passwordHash` | varchar | Hash de la contraseña | NOT NULL, SELECT: false |
| `hourlyRate` | decimal(10,2) | Costo por hora para reportes | DEFAULT: 0 |
| `createdAt` | timestamp | Fecha de creación | Auto |
| `updatedAt` | timestamp | Fecha de última actualización | Auto |
| `deletedAt` | timestamp | Fecha de eliminación (soft delete) | Nullable |

### Relaciones

```typescript
@Entity('users')
export class User {
  // Campos gestionados por CAPATAZ
  @OneToMany(() => Field, field => field.manager)
  managedFields: Field[];
  
  // Órdenes de trabajo asignadas a OPERARIO
  @OneToMany(() => WorkOrder, order => order.assignedTo)
  assignedWorkOrders: WorkOrder[];
}
```

**Relaciones:**
- **1:N** → Field (managedFields) - Campos que gestiona si es CAPATAZ
- **1:N** → WorkOrder (assignedWorkOrders) - Tareas asignadas si es OPERARIO

---

## Roles del Sistema

### ADMIN (Administrador)

**Descripción:** Dueño de la empresa con acceso total.

**Capacidades:**
- ✅ Gestión completa de usuarios (crear, editar, eliminar)
- ✅ Acceso a todos los módulos sin restricciones
- ✅ Aprobar órdenes de compra
- ✅ Ver todos los reportes
- ✅ Hard delete de registros

**Restricciones:**
- ❌ Ninguna

---

### CAPATAZ (Field Manager)

**Descripción:** Supervisor encargado de campos específicos.

**Capacidades:**
- ✅ Gestionar sus campos asignados (`managedFields`)
- ✅ Crear y asignar órdenes de trabajo
- ✅ Aprobar/rechazar actividades
- ✅ Crear órdenes de compra (requieren aprobación ADMIN)
- ✅ Registrar recepciones de mercadería
- ✅ Gestionar lotes de cosecha

**Restricciones:**
- ❌ Solo ve campos donde es manager
- ❌ No puede aprobar órdenes de compra
- ❌ No puede gestionar usuarios
- ❌ No puede hacer hard delete

**Asignación:**
```typescript
// Al crear un Field, se asigna un CAPATAZ
const field = {
  name: "Campo Norte",
  managerId: capatazUser.id  // Solo usuarios con role: CAPATAZ
};
```

---

### OPERARIO (Field Worker)

**Descripción:** Trabajador que ejecuta tareas en campo.

**Capacidades:**
- ✅ Ver sus órdenes de trabajo asignadas
- ✅ Registrar actividades realizadas
- ✅ Reportar uso de insumos
- ✅ Registrar horas trabajadas
- ✅ Marcar tareas como completadas

**Restricciones:**
- ❌ Solo ve sus propias Work Orders
- ❌ No puede crear órdenes de trabajo
- ❌ No puede aprobar/rechazar actividades
- ❌ No puede gestionar compras ni ventas
- ❌ Solo lectura en campos/parcelas donde trabaja

---

## Componentes del Módulo

### 1. UserController (`controllers/user.controller.ts`)

```typescript
class UserController {
  /**
   * Obtener todos los usuarios
   * Solo ADMIN
   */
  async getAll(req: Request, res: Response): Promise<void>
  
  /**
   * Obtener usuario por ID
   * Solo ADMIN o el propio usuario
   */
  async getById(req: Request, res: Response): Promise<void>
  
  /**
   * Crear nuevo usuario
   * Solo ADMIN
   */
  async create(req: Request, res: Response): Promise<void>
  
  /**
   * Actualizar usuario
   * Solo ADMIN o el propio usuario (datos limitados)
   */
  async update(req: Request, res: Response): Promise<void>
  
  /**
   * Eliminar usuario (soft delete)
   * Solo ADMIN
   */
  async delete(req: Request, res: Response): Promise<void>
  
  /**
   * Restaurar usuario eliminado
   * Solo ADMIN
   */
  async restore(req: Request, res: Response): Promise<void>
  
  /**
   * Eliminar permanentemente
   * Solo ADMIN
   */
  async hardDelete(req: Request, res: Response): Promise<void>
}
```

---

### 2. UserService (`services/user.service.ts`)

```typescript
class UserService {
  /**
   * Obtener todos los usuarios
   * @param includeDeleted - Incluir usuarios eliminados
   */
  async getAll(includeDeleted: boolean = false): Promise<User[]>
  
  /**
   * Buscar usuario por ID
   */
  async getById(id: string): Promise<User>
  
  /**
   * Buscar usuario por email
   */
  async getByEmail(email: string): Promise<User | null>
  
  /**
   * Crear nuevo usuario
   */
  async create(dto: CreateUserDto): Promise<User>
  
  /**
   * Actualizar usuario existente
   */
  async update(id: string, dto: UpdateUserDto): Promise<User>
  
  /**
   * Soft delete de usuario
   */
  async delete(id: string): Promise<void>
  
  /**
   * Restaurar usuario eliminado
   */
  async restore(id: string): Promise<User>
  
  /**
   * Hard delete (eliminación permanente)
   */
  async hardDelete(id: string): Promise<void>
}
```

---

### 3. DTOs

#### CreateUserDto

```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.OPERARIO;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number = 0;
}
```

#### UpdateUserDto

```typescript
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;
}
```

---

## Endpoints

### GET /users

Obtener lista de todos los usuarios.

**Autorización:** Solo ADMIN

**Query Parameters:**
- `includeDeleted` (boolean): Incluir usuarios eliminados

**Request:**
```
GET /users
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "email": "admin@tejadahnos.com",
    "name": "Admin",
    "lastName": "Sistema",
    "role": "ADMIN",
    "hourlyRate": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "email": "capataz@tejadahnos.com",
    "name": "Juan",
    "lastName": "Pérez",
    "role": "CAPATAZ",
    "hourlyRate": 15.50,
    "createdAt": "2025-01-02T00:00:00.000Z",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  }
]
```

---

### GET /users/:id

Obtener usuario por ID.

**Autorización:** ADMIN o el propio usuario

**Request:**
```
GET /users/uuid-del-usuario
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid-del-usuario",
  "email": "operario@tejadahnos.com",
  "name": "Pedro",
  "lastName": "González",
  "role": "OPERARIO",
  "hourlyRate": 12.00,
  "createdAt": "2025-01-03T00:00:00.000Z",
  "updatedAt": "2025-01-03T00:00:00.000Z",
  "assignedWorkOrders": [
    {
      "id": "wo-uuid-1",
      "title": "Poda de campo norte",
      "status": "IN_PROGRESS"
    }
  ]
}
```

**Response (403):**
```json
{
  "message": "No tienes permisos para ver este usuario"
}
```

**Response (404):**
```json
{
  "message": "Usuario no encontrado"
}
```

---

### POST /users

Crear nuevo usuario.

**Autorización:** Solo ADMIN

**Request:**
```json
POST /users
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "email": "nuevo@tejadahnos.com",
  "name": "Carlos",
  "lastName": "Rodríguez",
  "role": "CAPATAZ",
  "password": "password123",
  "hourlyRate": 18.00
}
```

**Response (201):**
```json
{
  "id": "nuevo-uuid",
  "email": "nuevo@tejadahnos.com",
  "name": "Carlos",
  "lastName": "Rodríguez",
  "role": "CAPATAZ",
  "hourlyRate": 18.00,
  "createdAt": "2025-01-04T00:00:00.000Z",
  "updatedAt": "2025-01-04T00:00:00.000Z"
}
```

**Response (400):**
```json
{
  "message": "Errores de validación",
  "errors": [
    {
      "field": "email",
      "constraints": {
        "isEmail": "email must be a valid email"
      }
    }
  ]
}
```

**Response (409):**
```json
{
  "message": "El email ya está registrado"
}
```

---

### PUT /users/:id

Actualizar usuario existente.

**Autorización:** ADMIN o el propio usuario (campos limitados)

**Request:**
```json
PUT /users/uuid-del-usuario
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Carlos Actualizado",
  "hourlyRate": 20.00
}
```

**Response (200):**
```json
{
  "id": "uuid-del-usuario",
  "email": "nuevo@tejadahnos.com",
  "name": "Carlos Actualizado",
  "lastName": "Rodríguez",
  "role": "CAPATAZ",
  "hourlyRate": 20.00,
  "updatedAt": "2025-01-05T00:00:00.000Z"
}
```

**Nota:** Los usuarios no-ADMIN solo pueden actualizar:
- `name`
- `lastName`
- `password`

---

### DELETE /users/:id

Eliminar usuario (soft delete).

**Autorización:** Solo ADMIN

**Request:**
```
DELETE /users/uuid-del-usuario
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "message": "Usuario eliminado correctamente"
}
```

**Nota:** El usuario no se elimina de la BD, solo se marca `deletedAt`.

---

### PATCH /users/:id/restore

Restaurar usuario eliminado.

**Autorización:** Solo ADMIN

**Request:**
```
PATCH /users/uuid-del-usuario/restore
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "id": "uuid-del-usuario",
  "email": "restaurado@tejadahnos.com",
  "name": "Usuario",
  "lastName": "Restaurado",
  "role": "OPERARIO",
  "deletedAt": null,
  "updatedAt": "2025-01-06T00:00:00.000Z"
}
```

---

### DELETE /users/:id/permanent

Eliminar permanentemente usuario (hard delete).

**Autorización:** Solo ADMIN

**Request:**
```
DELETE /users/uuid-del-usuario/permanent
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "message": "Usuario eliminado permanentemente"
}
```

**⚠️ Advertencia:** Esta acción es irreversible.

---

## Casos de Uso

### Caso 1: Crear Usuario CAPATAZ

**Actor:** ADMIN

**Flujo:**
1. ADMIN accede al sistema
2. Navega a gestión de usuarios
3. Crea nuevo usuario con rol CAPATAZ
4. Asigna hourlyRate si corresponde
5. Sistema genera contraseña hasheada
6. Usuario CAPATAZ puede iniciar sesión
7. ADMIN puede asignar campos al CAPATAZ

**Código:**
```typescript
const createCapataz = async () => {
  const newUser = await userService.create({
    email: 'capataz.norte@tejadahnos.com',
    name: 'José',
    lastName: 'Martínez',
    role: UserRole.CAPATAZ,
    password: 'temporal123',
    hourlyRate: 16.50
  });
  
  // Asignar campo
  await fieldService.update(fieldId, {
    managerId: newUser.id
  });
};
```

---

### Caso 2: Operario Actualiza su Perfil

**Actor:** OPERARIO

**Flujo:**
1. OPERARIO autenticado
2. Accede a su perfil
3. Actualiza nombre o password
4. Sistema valida que solo actualice campos permitidos
5. Cambios guardados

**Validación:**
```typescript
// Middleware verifica que usuario común solo actualice sus datos
if (req.user.role !== UserRole.ADMIN && req.user.id !== req.params.id) {
  throw new ForbiddenError();
}

// Filtrar campos permitidos para no-ADMIN
if (req.user.role !== UserRole.ADMIN) {
  const allowedFields = ['name', 'lastName', 'password'];
  dto = pick(dto, allowedFields);
}
```

---

### Caso 3: Listar Usuarios Activos

**Actor:** ADMIN

**Flujo:**
1. ADMIN solicita lista de usuarios
2. Sistema retorna solo usuarios activos (deletedAt = null)
3. ADMIN puede filtrar por rol
4. ADMIN ve estadísticas de usuarios

---

## Validaciones

### Al Crear Usuario

```typescript
// Email único
const existing = await userRepo.findOne({ where: { email: dto.email } });
if (existing) {
  throw new ConflictError('El email ya está registrado');
}

// Password seguro
if (dto.password.length < 6) {
  throw new ValidationError('Password debe tener al menos 6 caracteres');
}

// Rol válido
if (!Object.values(UserRole).includes(dto.role)) {
  throw new ValidationError('Rol inválido');
}

// HourlyRate no negativo
if (dto.hourlyRate < 0) {
  throw new ValidationError('hourlyRate no puede ser negativo');
}
```

---

### Al Actualizar Usuario

```typescript
// Email único si se cambia
if (dto.email && dto.email !== user.email) {
  const existing = await userRepo.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new ConflictError('El email ya está en uso');
  }
}

// No permitir cambiar rol a sí mismo si es el último ADMIN
if (dto.role && user.role === UserRole.ADMIN) {
  const adminCount = await userRepo.count({ 
    where: { role: UserRole.ADMIN } 
  });
  
  if (adminCount === 1) {
    throw new ValidationError('No puedes cambiar el rol del último ADMIN');
  }
}
```

---

### Al Eliminar Usuario

```typescript
// Verificar que no sea el último ADMIN
if (user.role === UserRole.ADMIN) {
  const adminCount = await userRepo.count({ 
    where: { role: UserRole.ADMIN } 
  });
  
  if (adminCount === 1) {
    throw new ValidationError('No puedes eliminar el único ADMIN del sistema');
  }
}

// Verificar dependencias (soft delete permite mantener relaciones)
// Los campos gestionados quedan sin manager (managerId = null)
// Las work orders quedan sin asignar (assignedToId = null)
```

---

## Seguridad

### 1. Password Hashing

```typescript
// Al crear
user.passwordHash = await bcrypt.hash(dto.password, 10);

// Al actualizar password
if (dto.password) {
  user.passwordHash = await bcrypt.hash(dto.password, 10);
}

// passwordHash nunca se expone
@Column({ select: false })
passwordHash: string;
```

---

### 2. Protección de Rutas

```typescript
// Solo ADMIN puede gestionar usuarios
router.get('/', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  userController.getAll
);

// Usuario puede ver su propio perfil
router.get('/:id',
  authenticate,
  authorizeUserAccess, // Middleware personalizado
  userController.getById
);
```

---

### 3. Middleware authorizeUserAccess

```typescript
export const authorizeUserAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user!;
  const targetUserId = req.params.id;
  
  // ADMIN puede ver cualquier usuario
  if (user.role === UserRole.ADMIN) {
    return next();
  }
  
  // Usuarios solo pueden ver su propio perfil
  if (user.id === targetUserId) {
    return next();
  }
  
  return res.status(403).json({
    message: 'No tienes permisos para acceder a este usuario'
  });
};
```

---

## Reportes y Consultas

### Usuarios por Rol

```typescript
const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  return await userRepo.find({
    where: { role },
    order: { createdAt: 'DESC' }
  });
};
```

### Capataces con sus Campos

```typescript
const getCapatacesWithFields = async (): Promise<User[]> => {
  return await userRepo.find({
    where: { role: UserRole.CAPATAZ },
    relations: ['managedFields'],
    order: { name: 'ASC' }
  });
};
```

### Operarios con Órdenes Activas

```typescript
const getOperariosWithActiveOrders = async (): Promise<User[]> => {
  return await userRepo.find({
    where: { 
      role: UserRole.OPERARIO,
      assignedWorkOrders: {
        status: In([WorkOrderStatus.PENDING, WorkOrderStatus.IN_PROGRESS])
      }
    },
    relations: ['assignedWorkOrders']
  });
};
```

---

## Mejoras Futuras

- [ ] Cambio de contraseña con confirmación de password actual
- [ ] Reset de contraseña por email
- [ ] Foto de perfil
- [ ] Configuraciones personalizadas por usuario
- [ ] Historial de cambios en usuarios
- [ ] Notificaciones por email al crear usuario
- [ ] Importación masiva de usuarios (CSV)
- [ ] Exportación de lista de usuarios

---

**Documentación relacionada:**
- [01-AUTENTICACION.md](./01-AUTENTICACION.md) - Sistema de autenticación
- [ROLES_PERMISOS.md](../ROLES_PERMISOS.md) - Permisos detallados por rol
- [API: endpoints-usuarios.md](../API/endpoints-usuarios.md) - Documentación completa de endpoints
