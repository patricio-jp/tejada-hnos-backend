# 🔐 Roles y Permisos

## Índice
- [Sistema de Autenticación](#sistema-de-autenticación)
- [Roles del Sistema](#roles-del-sistema)
- [Matriz de Permisos](#matriz-de-permisos)
- [Autorización por Campo](#autorización-por-campo)
- [Flujos de Aprobación](#flujos-de-aprobación)
- [Implementación Técnica](#implementación-técnica)

---

## Sistema de Autenticación

### JWT (JSON Web Tokens)

El sistema utiliza **JWT** para autenticación stateless con dos tipos de tokens:

| Token | Duración | Propósito | Storage |
|-------|----------|-----------|---------|
| **Access Token** | 3 horas | Autenticar requests API | localStorage/memory |
| **Refresh Token** | 7 días | Renovar access token | httpOnly cookie (recomendado) |

### Payload del Access Token

```typescript
interface JWTPayload {
  userId: string;      // UUID del usuario
  role: UserRole;      // ADMIN, CAPATAZ, OPERARIO
  email: string;       // Email del usuario
  iat: number;         // Issued at (timestamp)
  exp: number;         // Expiration (timestamp)
}
```

### Flujo de Autenticación

```
┌─────────┐                              ┌─────────┐
│ Cliente │                              │  API    │
└────┬────┘                              └────┬────┘
     │                                        │
     │  POST /auth/login                      │
     │  { email, password }                   │
     ├───────────────────────────────────────>│
     │                                        │
     │                        Verificar       │
     │                        credenciales    │
     │                                        │
     │  { accessToken, refreshToken }         │
     │<───────────────────────────────────────┤
     │                                        │
     │  GET /api/resource                     │
     │  Authorization: Bearer {accessToken}   │
     ├───────────────────────────────────────>│
     │                                        │
     │                        Verificar JWT   │
     │                        Extraer user    │
     │                                        │
     │  { data }                              │
     │<───────────────────────────────────────┤
     │                                        │
     │  (Token expirado)                      │
     │                                        │
     │  POST /auth/refresh-token              │
     │  { refreshToken }                      │
     ├───────────────────────────────────────>│
     │                                        │
     │  { accessToken, refreshToken }         │
     │<───────────────────────────────────────┤
     │                                        │
```

---

## Roles del Sistema

### 1. ADMIN (Administrador)

**Descripción**: Dueño de la empresa con acceso completo al sistema.

**Responsabilidades:**
- ✅ Gestión completa de usuarios
- ✅ Acceso a todos los campos y parcelas
- ✅ Aprobar órdenes de compra
- ✅ Ver y modificar todas las órdenes de trabajo
- ✅ Acceso a todos los reportes
- ✅ Gestión de proveedores y clientes
- ✅ Configuración del sistema
- ✅ Hard delete de registros

**Restricciones:**
- ❌ Ninguna (acceso total)

**Casos de Uso:**
- Supervisión general del negocio
- Aprobación de compras importantes
- Gestión de usuarios y asignación de roles
- Análisis de reportes financieros
- Decisiones estratégicas

---

### 2. CAPATAZ (Field Manager / Supervisor)

**Descripción**: Supervisor encargado de uno o más campos específicos.

**Responsabilidades:**
- ✅ Gestionar sus campos asignados (`managedFields`)
- ✅ Ver y gestionar parcelas de sus campos
- ✅ Crear y asignar órdenes de trabajo a operarios
- ✅ Aprobar/rechazar actividades de sus campos
- ✅ Crear órdenes de compra (pendientes de aprobación ADMIN)
- ✅ Registrar recepciones de mercadería
- ✅ Gestionar lotes de cosecha de sus parcelas
- ✅ Ver reportes de sus campos

**Restricciones:**
- ❌ No puede acceder a campos que no gestiona
- ❌ No puede aprobar órdenes de compra (solo crearlas)
- ❌ No puede crear/modificar usuarios
- ❌ No puede hacer hard delete
- ❌ No puede ver datos de otros capataces

**Autorización por Campo:**
```typescript
// Middleware verifica:
if (user.role === 'CAPATAZ') {
  // Solo puede ver/editar WorkOrders de sus campos gestionados
  const field = await findFieldByPlotId(workOrder.plotId);
  if (field.managerId !== user.id) {
    throw new ForbiddenError();
  }
}
```

**Casos de Uso:**
- Planificar trabajos semanales en sus campos
- Asignar tareas a operarios
- Supervisar avance de órdenes de trabajo
- Solicitar compra de insumos necesarios
- Registrar cosechas de sus parcelas

---

### 3. OPERARIO (Worker / Field Operator)

**Descripción**: Trabajador que ejecuta tareas en campo.

**Responsabilidades:**
- ✅ Ver sus órdenes de trabajo asignadas (`assignedWorkOrders`)
- ✅ Registrar actividades realizadas
- ✅ Reportar horas trabajadas
- ✅ Registrar uso de insumos
- ✅ Ver información de parcelas donde trabaja

**Restricciones:**
- ❌ No puede ver órdenes de trabajo de otros operarios
- ❌ No puede crear órdenes de trabajo
- ❌ No puede asignar tareas
- ❌ No puede aprobar/rechazar actividades
- ❌ No puede gestionar compras
- ❌ No puede ver proveedores ni clientes
- ❌ No puede gestionar campos/parcelas
- ❌ Solo lectura en insumos (ver stock disponible)

**Casos de Uso:**
- Consultar mis tareas del día
- Registrar que completé una poda (crear Activity)
- Reportar uso de 5kg de fertilizante
- Marcar orden de trabajo como completada
- Ver detalles de la parcela donde estoy trabajando

---

## Matriz de Permisos

### Módulo: Usuarios

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar todos | ✅ | ❌ | ❌ |
| Ver perfil propio | ✅ | ✅ | ✅ |
| Crear usuario | ✅ | ❌ | ❌ |
| Actualizar usuario | ✅ (todos) | ❌ | ❌ |
| Actualizar perfil propio | ✅ | ✅ | ✅ |
| Eliminar usuario | ✅ | ❌ | ❌ |
| Cambiar rol | ✅ | ❌ | ❌ |

### Módulo: Campos (Fields)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar todos | ✅ | ✅ (solo sus campos) | ❌ |
| Ver detalles | ✅ | ✅ (solo sus campos) | ❌ |
| Crear campo | ✅ | ❌ | ❌ |
| Actualizar campo | ✅ | ✅ (solo sus campos) | ❌ |
| Eliminar campo | ✅ | ❌ | ❌ |
| Asignar manager | ✅ | ❌ | ❌ |

### Módulo: Parcelas (Plots)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ (de sus campos) | ✅ (donde trabaja) |
| Ver detalles | ✅ | ✅ (de sus campos) | ✅ (donde trabaja) |
| Crear parcela | ✅ | ✅ (en sus campos) | ❌ |
| Actualizar parcela | ✅ | ✅ (de sus campos) | ❌ |
| Eliminar parcela | ✅ | ✅ (de sus campos) | ❌ |

### Módulo: Variedades (Varieties)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ✅ |
| Ver detalles | ✅ | ✅ | ✅ |
| Crear variedad | ✅ | ❌ | ❌ |
| Actualizar variedad | ✅ | ❌ | ❌ |
| Eliminar variedad | ✅ | ❌ | ❌ |

### Módulo: Órdenes de Trabajo (WorkOrders)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ (todas) | ✅ (de sus campos) | ✅ (asignadas a él) |
| Ver detalles | ✅ | ✅ (de sus campos) | ✅ (asignadas a él) |
| Crear | ✅ | ✅ (en sus campos) | ❌ |
| Actualizar | ✅ | ✅ (de sus campos) | ❌ |
| Asignar operario | ✅ | ✅ (de sus campos) | ❌ |
| Cambiar estado | ✅ | ✅ (de sus campos) | ✅ (marcar completada) |
| Eliminar | ✅ | ✅ (de sus campos) | ❌ |

### Módulo: Actividades (Activities)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ (todas) | ✅ (de sus campos) | ✅ (de sus OT) |
| Ver detalles | ✅ | ✅ (de sus campos) | ✅ (de sus OT) |
| Crear | ✅ | ✅ | ✅ (en sus OT) |
| Actualizar | ✅ | ✅ (de sus campos) | ✅ (propias, si PENDING) |
| Aprobar/Rechazar | ✅ | ✅ (de sus campos) | ❌ |
| Eliminar | ✅ | ✅ (de sus campos) | ❌ |

### Módulo: Insumos (Inputs)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ✅ (solo lectura) |
| Ver stock | ✅ | ✅ | ✅ |
| Crear insumo | ✅ | ❌ | ❌ |
| Actualizar insumo | ✅ | ❌ | ❌ |
| Eliminar insumo | ✅ | ❌ | ❌ |
| Registrar uso | ✅ | ✅ | ✅ (vía Activities) |

### Módulo: Proveedores (Suppliers)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### Módulo: Órdenes de Compra (PurchaseOrders)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ (si PENDIENTE) | ❌ |
| Aprobar (PENDIENTE→APROBADA) | ✅ | ❌ | ❌ |
| Cancelar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ✅ | ❌ |

### Módulo: Recepciones (GoodsReceipts)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear recepción | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### Módulo: Lotes de Cosecha (HarvestLots)

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ (de sus campos) | ❌ |
| Ver detalles | ✅ | ✅ (de sus campos) | ❌ |
| Crear | ✅ | ✅ (de sus campos) | ❌ |
| Actualizar (procesar) | ✅ | ✅ (de sus campos) | ❌ |
| Cambiar estado | ✅ | ✅ (de sus campos) | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### Módulo: Clientes (Customers) - PENDIENTE

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### Módulo: Órdenes de Venta (SalesOrders) - PENDIENTE

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ | ❌ |
| Aprobar | ✅ | ❌ | ❌ |
| Cancelar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### Módulo: Despachos (Shipments) - PENDIENTE

| Acción | ADMIN | CAPATAZ | OPERARIO |
|--------|-------|---------|----------|
| Listar | ✅ | ✅ | ❌ |
| Ver detalles | ✅ | ✅ | ❌ |
| Crear despacho | ✅ | ✅ | ❌ |
| Actualizar | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

---

## Autorización por Campo

### Concepto

Los **CAPATACES** solo pueden gestionar campos donde están asignados como `manager`. Este control se implementa en dos niveles:

1. **Middleware `authorizeFieldAccess`** - Valida acceso automáticamente
2. **Filtros en queries** - Solo retorna datos de campos gestionados

### Implementación

```typescript
// middleware/authorize-field-access.middleware.ts

export const authorizeFieldAccess = (dataSource: DataSource) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user!;
    
    // ADMIN tiene acceso a todo
    if (user.role === UserRole.ADMIN) {
      return next();
    }
    
    // CAPATAZ: verificar acceso a campo
    if (user.role === UserRole.CAPATAZ) {
      const fieldId = await extractFieldIdFromRequest(req);
      const field = await dataSource.getRepository(Field).findOne({
        where: { id: fieldId }
      });
      
      if (!field || field.managerId !== user.id) {
        return res.status(403).json({
          message: 'No tienes acceso a este campo'
        });
      }
    }
    
    // OPERARIO: solo ve sus WorkOrders asignadas
    if (user.role === UserRole.OPERARIO) {
      const workOrderId = req.params.id;
      const workOrder = await dataSource.getRepository(WorkOrder).findOne({
        where: { id: workOrderId }
      });
      
      if (!workOrder || workOrder.assignedToId !== user.id) {
        return res.status(403).json({
          message: 'No tienes acceso a esta orden de trabajo'
        });
      }
    }
    
    next();
  };
};
```

### Ejemplo de Uso

```typescript
// En routes/work-order.routes.ts

router.get('/:id',
  authenticate,                      // 1. Verificar JWT
  authorizeFieldAccess(dataSource),  // 2. Verificar acceso a campo
  workOrderController.getById        // 3. Ejecutar acción
);
```

---

## Flujos de Aprobación

### 1. Aprobación de Actividades

```
┌──────────┐         ┌─────────┐         ┌────────────┐
│ OPERARIO │         │ CAPATAZ │         │   SISTEMA  │
└────┬─────┘         └────┬────┘         └─────┬──────┘
     │                    │                     │
     │ Crear Activity     │                     │
     │ status: PENDING    │                     │
     ├───────────────────────────────────────────>
     │                    │                     │
     │                    │  Revisar Activity   │
     │                    ├────────────────────>│
     │                    │                     │
     │                    │ Aprobar/Rechazar    │
     │                    ├────────────────────>│
     │                    │                     │
     │                    │  Si APPROVED:       │
     │                    │  - Descontar stock  │
     │                    │  - Contabilizar hrs │
     │                    │                     │
     │                    │  Si REJECTED:       │
     │                    │  - No afectar datos │
     │                    │                     │
```

**Estados:**
- `PENDING` → Creada por OPERARIO, esperando aprobación
- `APPROVED` → Aprobada por CAPATAZ/ADMIN (se aplican cambios)
- `REJECTED` → Rechazada (no se aplican cambios)

**Reglas:**
- Solo el CAPATAZ del campo o ADMIN puede aprobar/rechazar
- Una vez APPROVED o REJECTED, no se puede modificar
- El stock de insumos solo se descuenta al aprobar

---

### 2. Aprobación de Órdenes de Compra

```
┌─────────┐         ┌───────┐
│ CAPATAZ │         │ ADMIN │
└────┬────┘         └───┬───┘
     │                  │
     │ Crear PO         │
     │ status: PENDIENTE│
     ├─────────────────────>
     │                  │
     │                  │ Revisar PO
     │                  │ (verificar precios,
     │                  │  proveedor, etc.)
     │                  │
     │                  │ Aprobar
     │                  │ status: APROBADA
     │                  ├──────>
     │                  │
     │ Registrar        │
     │ GoodsReceipt     │
     ├─────────────────────>
     │                  │
     │ status automático:│
     │ RECIBIDA_PARCIAL │
     │ o RECIBIDA       │
     │                  │
```

**Estados:**
- `PENDIENTE` → Creada por CAPATAZ
- `APROBADA` → Aprobada por ADMIN (lista para recibir)
- `RECIBIDA_PARCIAL` → Recepción parcial
- `RECIBIDA` → Totalmente recibida
- `CERRADA` → Proceso completado
- `CANCELADA` → Cancelada

**Reglas:**
- Solo ADMIN puede cambiar PENDIENTE → APROBADA
- Solo se pueden registrar recepciones si está APROBADA
- El estado RECIBIDA/RECIBIDA_PARCIAL se actualiza automáticamente
- No se puede editar si no está en PENDIENTE

---

### 3. Proceso de Órdenes de Venta (PENDIENTE)

```
┌─────────┐         ┌───────┐
│ CAPATAZ │         │ ADMIN │
└────┬────┘         └───┬───┘
     │                  │
     │ Crear SalesOrder │
     │ status: PENDIENTE│
     ├─────────────────────>
     │                  │
     │                  │ Aprobar
     │                  │ status: APROBADA
     │                  ├──────>
     │                  │
     │ Crear Shipment   │
     │ (seleccionar     │
     │  HarvestLots)    │
     ├─────────────────────>
     │                  │
     │ status automático:│
     │ DESPACHADA       │
     │                  │
```

---

## Implementación Técnica

### Middleware de Autenticación

```typescript
// middleware/auth.middleware.ts

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    const user = await dataSource.getRepository(User).findOne({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Middleware de Autorización por Rol

```typescript
// middleware/authorize.middleware.ts

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para esta acción' 
      });
    }
    
    next();
  };
};
```

### Ejemplo Completo en Ruta

```typescript
// routes/purchase-order.routes.ts

router.post(
  '/',
  authenticate,                              // 1. Verificar JWT
  authorize(UserRole.ADMIN, UserRole.CAPATAZ), // 2. Verificar rol
  validateData(CreatePurchaseOrderDto),      // 3. Validar datos
  purchaseOrderController.create             // 4. Ejecutar
);

router.patch(
  '/:id/status',
  authenticate,                              // 1. Verificar JWT
  authorize(UserRole.ADMIN),                 // 2. Solo ADMIN
  validateData(UpdatePurchaseOrderStatusDto),// 3. Validar datos
  purchaseOrderController.updateStatus       // 4. Ejecutar
);
```

### Filtrado en Servicios

```typescript
// services/work-order.service.ts

async getAll(user: User, filters?: any) {
  const query = this.repository.createQueryBuilder('wo');
  
  // ADMIN: ve todo
  if (user.role === UserRole.ADMIN) {
    // Sin filtros adicionales
  }
  
  // CAPATAZ: solo sus campos
  else if (user.role === UserRole.CAPATAZ) {
    query
      .innerJoin('wo.plots', 'plot')
      .innerJoin('plot.field', 'field')
      .where('field.managerId = :userId', { userId: user.id });
  }
  
  // OPERARIO: solo sus asignadas
  else if (user.role === UserRole.OPERARIO) {
    query.where('wo.assignedToId = :userId', { userId: user.id });
  }
  
  return await query.getMany();
}
```

---

## Mejores Prácticas

### 1. Principio de Menor Privilegio

Otorgar solo los permisos mínimos necesarios para cada rol.

### 2. Defensa en Profundidad

Validar permisos en múltiples capas:
- Middleware de autenticación
- Middleware de autorización por rol
- Middleware de autorización por campo
- Validación en servicios

### 3. No Confiar en el Cliente

Siempre validar permisos en el backend, nunca solo en frontend.

### 4. Logging de Acciones Sensibles

Registrar en logs:
- Aprobaciones de compras
- Cambios de estado importantes
- Accesos denegados (posibles intentos de intrusión)

### 5. Tokens de Corta Duración

- Access tokens: 3 horas máximo
- Refresh tokens: 7 días máximo
- Posibilidad de revocar tokens (lista negra o base de datos)

---

## Seguridad Adicional

### Headers HTTP Recomendados

```typescript
app.use(helmet()); // Agrega headers de seguridad

// CORS configurado
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Rate Limiting

```typescript
// Limitar intentos de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login'
});

router.post('/auth/login', loginLimiter, authController.login);
```

### Validación de Inputs

Siempre usar `class-validator` en DTOs para prevenir inyecciones.

---

**Próximo paso**: Revisar los [diagramas de flujo](./FLUJOS/) para entender cómo se aplican estos permisos en los procesos de negocio.
