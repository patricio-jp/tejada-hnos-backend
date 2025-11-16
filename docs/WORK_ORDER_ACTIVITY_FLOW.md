# 📋 Flujo de Estados: WorkOrders y Activities (SIMPLIFICADO)

## 🎯 Concepto General

El sistema maneja dos entidades principales para la gestión del trabajo agrícola:

- **WorkOrder (Orden de Trabajo)**: Planificación y seguimiento de tareas asignadas por capataces a operarios
- **Activity (Actividad)**: Registro de trabajos **ya realizados** en campo, que requieren auditoría de stock y horas

## 🔄 Estados y Transiciones

### WorkOrderStatus - CONTROL CENTRALIZADO

```
PENDING → IN_PROGRESS → UNDER_REVIEW → COMPLETED
                                    ↓
                                CANCELLED
```

| Estado WorkOrder | Crear Activities | Editar contenido | Aprobar/Rechazar (solo status) | Desbloquear |
|------------------|------------------|------------------|-------------------------------|-------------|
| `PENDING` | ❌ Nadie | ❌ Nadie | ✅ Capataz | - |
| `IN_PROGRESS` | ✅ Todos | ✅ Todos (solo PENDING) | ✅ Capataz | - |
| `UNDER_REVIEW` | ❌ **Nadie (🔒 CONGELADO)** | ❌ **Nadie (🔒 CONGELADO)** | ✅ Capataz* | ✅ Capataz → `IN_PROGRESS` |
| `COMPLETED` | ❌ Nadie | ❌ Nadie | ❌ Nadie | ❌ No |

\* Capataz puede **solo cambiar status** (APPROVED/REJECTED) pero no editar campos (inputs, horas, etc.)

\* **Excepción**: Capataz puede aprobar/rechazar actividades sin editar contenido

### ActivityStatus - SIMPLIFICADO (3 estados)

```
PENDING → APPROVED ✓
       → REJECTED ✗
```

| Estado | Descripción | Stock descontado | Quién lo establece | Cuándo |
|--------|-------------|-----------------|-------------------|--------|
| `PENDING` | Actividad registrada, esperando revisión | ❌ No | Operario al crear | Durante `IN_PROGRESS` |
| `APPROVED` | Capataz validó stock y horas | ✅ **SÍ** | Capataz/Admin | En cualquier momento ⭐ |
| `REJECTED` | Capataz rechazó por inconsistencias | ❌ No | Capataz/Admin | En cualquier momento ⭐ |

⭐ **Auditoría flexible**: Capataz puede aprobar/rechazar actividades (cambiar status) en cualquier momento, **SIN necesidad de editar otros campos**

## 👤 Permisos por Rol

### OPERARIO (Trabajador de campo)

#### En WorkOrders:
- ✅ Ver órdenes asignadas a él
- ✅ Actualizar **solo el status** de órdenes asignadas a él
- ✅ Transiciones permitidas:
  - `PENDING` → `IN_PROGRESS` (empezar a trabajar)
  - `IN_PROGRESS` → `UNDER_REVIEW` (marcar como completada)
- ❌ No puede modificar otros campos (fechas, descripción, asignación)
- ❌ No puede cambiar órdenes en `UNDER_REVIEW`, `COMPLETED` o `CANCELLED`

#### En Activities:
- ✅ Crear actividades **solo si WorkOrder está `IN_PROGRESS`** (siempre como `PENDING`)
- ✅ Editar actividades `PENDING` **solo si WorkOrder está `IN_PROGRESS`**
- ❌ NO puede crear/editar si WorkOrder está en `UNDER_REVIEW` (🔒 **CONGELADO**)
- ❌ NO puede crear/editar si WorkOrder está en `COMPLETED` o `CANCELLED`
- ❌ No puede aprobar/rechazar (cambiar a `APPROVED`/`REJECTED`)
- ❌ No puede modificar actividades `APPROVED` o `REJECTED` (inmutables)

### CAPATAZ / ADMIN (Supervisores)

#### En WorkOrders:
- ✅ Ver todas las órdenes (CAPATAZ: solo de sus campos gestionados)
- ✅ Crear órdenes de trabajo
- ✅ Modificar todos los campos de las órdenes
- ✅ Cambiar a cualquier estado
- ✅ **Devolver a IN_PROGRESS**: `UNDER_REVIEW` → `IN_PROGRESS` (si falta agregar actividades)
- ✅ Cerrar órdenes: `UNDER_REVIEW` → `COMPLETED` ⚠️ **Solo si todas las actividades están aprobadas/rechazadas**
- ✅ Cancelar órdenes

#### En Activities:
- ✅ Crear actividades **solo si WorkOrder está `IN_PROGRESS`** (como `APPROVED` directamente)
- ✅ Editar actividades `PENDING` **solo si WorkOrder está `IN_PROGRESS`**
- ✅ **Aprobación/Rechazo flexible**: Cambiar status a `APPROVED`/`REJECTED` en **cualquier momento** (incluso si WorkOrder está `UNDER_REVIEW`)
- ⚠️ **NO puede editar contenido** (inputs, horas, etc.) si WorkOrder está `UNDER_REVIEW`
- ❌ No pueden modificar actividades `APPROVED` o `REJECTED` (inmutables)

## 🔒 Reglas de Inmutabilidad

### Activities APPROVED o REJECTED son INMUTABLES

Una vez que una actividad es **aprobada** o **rechazada**, **NADIE** puede modificarla (ni operarios, ni capataces, ni admins).

**Razones:**
1. ✅ **Integridad del historial**: Preserva el registro auditado de stock y horas
2. ✅ **Trazabilidad**: Mantiene evidencia de decisiones de supervisión
3. ✅ **Control de stock**: Evita inconsistencias en el inventario

**Si hay un error:**
- ❌ No modificar la actividad existente
- ✅ Crear una nueva actividad con los datos correctos
- ✅ Opcionalmente, agregar observaciones explicando la corrección

## 📊 Flujo Completo: Ejemplo Práctico

### Escenario: Riego de parcela con aplicación de fertilizante

#### 1️⃣ **Planificación (Capataz)**
```
Capataz crea WorkOrder:
  - Título: "Riego y fertilización - Parcela A"
  - Asignado a: Operario Juan
  - Status: PENDING
```

#### 2️⃣ **Inicio de Trabajo (Operario Juan)**
```
Juan llega a la parcela y empieza a trabajar:
  PUT /work-orders/{id}
  Body: { "status": "IN_PROGRESS" }
  
  → WorkOrder.status = IN_PROGRESS
  → ✅ Ahora puede crear/editar actividades
```

#### 3️⃣ **Registro de Actividades Realizadas (Operario Juan)**
```
Juan completa el riego y registra la actividad:
  POST /work-orders/{id}/activities
  Body: {
    "type": "RIEGO",
    "executionDate": "2025-11-15T10:30:00Z",
    "hoursWorked": 2.5,
    "inputsUsed": [
      { "inputId": "fertilizante-123", "quantity": 50, "unit": "KG" }
    ]
  }
  
  → Activity #1 creada con status = PENDING
  → Stock NO descontado aún

Juan realiza otra tarea y la registra:
  POST /work-orders/{id}/activities
  Body: {
    "type": "MANTENIMIENTO",
    "executionDate": "2025-11-15T13:00:00Z",
    "hoursWorked": 1.5,
    "details": { "description": "Limpieza de canales" }
  }
  
  → Activity #2 creada con status = PENDING
```

#### 4️⃣ **Marcar Orden como Completada (Operario Juan)**
```
Juan terminó todo su trabajo y marca la orden para revisión:
  PUT /work-orders/{id}
  Body: { "status": "UNDER_REVIEW" }
  
  → WorkOrder.status = UNDER_REVIEW
  → ❌ Juan ya NO puede crear/editar actividades (CONGELADO)
  → 🔔 Notificación al capataz: "Orden lista para revisión"
```

#### 5️⃣ **Revisión y Aprobación (Capataz)**
```
Capataz revisa las actividades:

1. Revisa Activity #1 (Riego):
  - Verifica 50 KG de fertilizante (correcto)
  - Valida 2.5 horas trabajadas
  
  PUT /activities/{activity1-id}
  Body: { "status": "APPROVED" }
  
  → Activity #1 status = APPROVED
  → ✅ Stock descontado: Fertilizante-123 -= 50 KG
  → Activity #1 ahora es INMUTABLE

2. Revisa Activity #2 (Mantenimiento):
  
  PUT /activities/{activity2-id}
  Body: { "status": "APPROVED" }
  
  → Activity #2 status = APPROVED
  → Activity #2 ahora es INMUTABLE
```

#### 6️⃣ **Cierre de Orden (Capataz)**
```
Capataz cierra la orden:
  PUT /work-orders/{id}
  Body: { "status": "COMPLETED" }
  
  ✅ Validación automática: Todas las actividades están APPROVED/REJECTED
  → WorkOrder.status = COMPLETED
  → Orden archivada
```

### 🕵️ Escenario: Auditoría en Tiempo Real

#### **Mientras Juan está trabajando (WorkOrder = IN_PROGRESS):**

```
Juan registra actividad de riego:
  POST /work-orders/{id}/activities → Activity status = PENDING

Juan sigue trabajando en otras tareas...

Capataz llega al campo y aprueba la actividad EN TIEMPO REAL:
  PUT /activities/{id}
  Body: { "status": "APPROVED" }  // Solo cambia status
  
  → ✅ Activity aprobada inmediatamente (stock descontado)
  → Juan puede seguir creando más actividades
  → WorkOrder sigue en IN_PROGRESS
```

**Ventaja**: No hay que esperar al final del día para validar y descontar stock

### 🔄 Escenario: Agregar Actividad Olvidada

#### **Juan marcó la orden como lista, pero olvidó registrar una tarea:**

```
Estado actual:
  WorkOrder.status = UNDER_REVIEW
  Juan NO puede crear actividades (congelado)

Juan intenta crear actividad:
  POST /work-orders/{id}/activities
  
  ❌ ERROR 403:
  "No se pueden crear actividades en una orden con estado UNDER_REVIEW.
   Si falta una actividad, devuelve la orden a IN_PROGRESS primero."

Capataz devuelve la orden a IN_PROGRESS:
  PUT /work-orders/{id}
  Body: { "status": "IN_PROGRESS" }
  
  → WorkOrder.status = IN_PROGRESS
  → 🔓 Se desbloquea la creación/edición

Juan registra la actividad faltante:
  POST /work-orders/{id}/activities
  Body: { "type": "MONITOREO", ... }
  
  → ✅ Activity creada con status = PENDING

Juan vuelve a marcar como lista:
  PUT /work-orders/{id}
  Body: { "status": "UNDER_REVIEW" }
  
  → WorkOrder.status = UNDER_REVIEW (congelado nuevamente)
```

## ⚠️ Casos de Rechazo

### Si el Capataz encuentra inconsistencias:

```
Capataz rechaza la actividad:
  PUT /activities/{id}
  Body: { 
    "status": "REJECTED",
    "details": { 
      "reason": "Cantidad de fertilizante incorrecta. Registró 50 KG pero el tanque indica 45 KG" 
    }
  }
  
  → Activity.status = REJECTED
  → Stock NO descontado
  → Activity ahora es INMUTABLE (no se puede editar)
```

### Opciones tras el rechazo:

#### **Opción A: Si WorkOrder aún está IN_PROGRESS**
```
Operario puede crear NUEVA actividad con datos correctos:
  POST /work-orders/{id}/activities
  Body: {
    "type": "RIEGO",
    "executionDate": "2025-11-15T10:30:00Z",
    "hoursWorked": 2.5,
    "inputsUsed": [
      { "inputId": "fertilizante-123", "quantity": 45, "unit": "KG" }
    ]
  }
  
  → Nueva Activity con status = PENDING
  → Operario puede marcar WorkOrder como UNDER_REVIEW cuando termine
```

#### **Opción B: Si WorkOrder está UNDER_REVIEW (congelado)**
```
El Capataz puede:
1. Crear una nueva actividad correctiva (como APPROVED):
  POST /work-orders/{id}/activities
  Body: {
    "type": "RIEGO",
    "executionDate": "2025-11-15T10:30:00Z",
    "hoursWorked": 2.5,
    "inputsUsed": [
      { "inputId": "fertilizante-123", "quantity": 45, "unit": "KG" }
    ],
    "status": "APPROVED"  // Capataz puede crear directamente aprobado
  }

2. O devolver la orden a IN_PROGRESS para que operario corrija:
  PUT /work-orders/{id}
  Body: { "status": "IN_PROGRESS" }
  
  → Operario puede crear/editar actividades nuevamente
```

### 🚫 Validaciones y Errores Comunes

#### **1. Intento de Crear Actividad en Orden Congelada**

```
WorkOrder.status = UNDER_REVIEW

Operario intenta crear actividad:
  POST /work-orders/{id}/activities
  Body: { "type": "RIEGO", ... }

❌ ERROR 403 - Forbidden:
{
  "message": "No se pueden crear actividades en una orden con estado UNDER_REVIEW. 
              Solo se pueden agregar actividades mientras la orden está en progreso (IN_PROGRESS). 
              Si falta una actividad, devuelve la orden a IN_PROGRESS primero."
}
```

#### **2. Intento de Editar Actividad en Orden Congelada**

```
WorkOrder.status = UNDER_REVIEW

Capataz intenta editar inputs de actividad:
  PUT /activities/{id}
  Body: { 
    "hoursWorked": 3.0,
    "inputsUsed": [...]
  }

❌ ERROR 403 - Forbidden:
{
  "message": "No puedes modificar actividades de una orden con estado UNDER_REVIEW. 
              Solo se pueden editar actividades mientras la orden está en progreso (IN_PROGRESS). 
              Si necesitas corregir algo, devuelve la orden a IN_PROGRESS primero."
}
```

#### **3. Aprobación Permitida (solo status)**

```
WorkOrder.status = UNDER_REVIEW

Capataz aprueba actividad (solo cambia status):
  PUT /activities/{id}
  Body: { "status": "APPROVED" }  // Solo 1 campo

✅ SUCCESS 200:
{
  "data": { "id": "...", "status": "APPROVED", ... },
  "message": "Actividad actualizada exitosamente."
}

→ Stock descontado inmediatamente
```

#### **4. Intento de Cerrar Orden con Actividades Pendientes**

```
Capataz intenta cerrar la orden:
  PUT /work-orders/{id}
  Body: { "status": "COMPLETED" }

❌ ERROR 400 - Bad Request:
{
  "message": "No puedes cerrar la orden. Hay 2 actividad(es) pendiente(s) de aprobación o rechazo. 
              Todas las actividades deben estar aprobadas o rechazadas antes de cerrar la orden."
}

→ Capataz debe aprobar/rechazar todas las actividades primero
```

## 🔗 Integración con Control de Stock

### Momento del Descuento de Stock

El stock se descuenta **SOLO** cuando una actividad cambia a `APPROVED`:

```typescript
// En activity.service.ts
public async update(id: string, data: UpdateActivityDto): Promise<Activity> {
  return await this.dataSource.transaction(async (manager) => {
    const activity = await manager.findOne(Activity, { where: { id } });
    
    // Si cambia de cualquier estado → APPROVED
    if (data.status === ActivityStatus.APPROVED && 
        activity.status !== ActivityStatus.APPROVED) {
      
      // Descontar stock de todos los inputs usados
      await this.validateAndDeductStock(activity.inputsUsed, manager);
    }
    
    // Si cambia de APPROVED → REJECTED (caso de corrección administrativa)
    if (data.status === ActivityStatus.REJECTED && 
        activity.status === ActivityStatus.APPROVED) {
      
      // Devolver stock al inventario
      await this.returnStock(activity.inputsUsed, manager);
    }
    
    manager.merge(activity, data);
    return await manager.save(activity);
  });
}
```

## 📱 Endpoints Relevantes

### WorkOrders

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/work-orders` | Listar órdenes (filtros aplicados por rol) | Todos |
| GET | `/work-orders/:id` | Ver detalle de orden | Todos |
| POST | `/work-orders` | Crear orden de trabajo | Capataz, Admin |
| PUT | `/work-orders/:id` | Actualizar orden | Operario (limitado), Capataz, Admin |
| DELETE | `/work-orders/:id` | Eliminar orden (soft delete) | Capataz, Admin |

### Activities

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/activities` | Listar actividades (filtros aplicados por rol) | Todos |
| GET | `/activities/:id` | Ver detalle de actividad | Todos |
| POST | `/work-orders/:workOrderId/activities` | Registrar actividad realizada | Todos |
| PUT | `/activities/:id` | Actualizar actividad | Operario (limitado), Capataz, Admin |
| DELETE | `/activities/:id` | Eliminar actividad (soft delete) | Capataz, Admin |

## 🎨 Recomendaciones para Frontend

### Vista de Operario

**Dashboard de Órdenes Asignadas:**
```
┌─────────────────────────────────────────┐
│ Mis Órdenes de Trabajo                  │
├─────────────────────────────────────────┤
│ 🔵 PENDIENTE                            │
│   Riego Parcela A - Vence hoy           │
│   [Iniciar Trabajo]                     │
├─────────────────────────────────────────┤
│ 🟢 EN PROGRESO                          │
│   Poda Parcela B - Iniciado 10:30      │
│   [Ver Actividades] [Marcar Completada] │
├─────────────────────────────────────────┤
│ 🟡 EN REVISIÓN                          │
│   Fertilización Parcela C               │
│   Esperando aprobación del capataz...  │
└─────────────────────────────────────────┘
```

**Botones según estado:**
- `PENDING` → Botón "Iniciar Trabajo" (→ `IN_PROGRESS`)
- `IN_PROGRESS` → Botones "Registrar Actividad" + "Marcar Completada" (→ `UNDER_REVIEW`)
- `UNDER_REVIEW` → Mensaje "En revisión..." (sin acciones)

### Vista de Capataz

**Dashboard de Revisión:**
```
┌─────────────────────────────────────────┐
│ Órdenes y Actividades para Revisar     │
├─────────────────────────────────────────┤
│ 🟡 3 Actividades pendientes de auditoría│
│                                         │
│ Riego Parcela A - Juan Pérez           │
│ Fertilizante: 50 KG | Horas: 2.5       │
│ [✅ Aprobar] [❌ Rechazar] [✏️ Editar] │
├─────────────────────────────────────────┤
│ 🟡 2 Órdenes completadas por operarios  │
│                                         │
│ Poda Parcela B - María García          │
│ 3 actividades registradas               │
│ [Ver Detalle] [Cerrar Orden]           │
└─────────────────────────────────────────┘
```

**Botones según estado:**
- Actividad `UNDER_REVIEW` → "Aprobar" / "Rechazar"
- WorkOrder `UNDER_REVIEW` → "Ver Actividades" / "Cerrar Orden"

## 🧪 Ejemplos de Pruebas

### Test: Operario marca actividad como lista

```typescript
describe('Activity Status Transitions - Operario', () => {
  it('Operario puede marcar actividad PENDING como UNDER_REVIEW', async () => {
    // Crear actividad como operario
    const activity = await request(app)
      .post(`/work-orders/${workOrderId}/activities`)
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({
        type: 'RIEGO',
        executionDate: new Date(),
        hoursWorked: 2.5,
        inputsUsed: [{ inputId: inputId, quantity: 50, unit: 'KG' }]
      });
    
    expect(activity.body.data.status).toBe('PENDING');
    
    // Marcar como lista para revisión
    const updated = await request(app)
      .put(`/activities/${activity.body.data.id}`)
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({ status: 'UNDER_REVIEW' });
    
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('UNDER_REVIEW');
    
    // Verificar que stock NO fue descontado
    const input = await request(app)
      .get(`/inputs/${inputId}`)
      .set('Authorization', `Bearer ${operarioToken}`);
    
    expect(input.body.data.currentStock).toBe(initialStock); // Sin cambios
  });
  
  it('Operario NO puede aprobar actividad directamente', async () => {
    const response = await request(app)
      .put(`/activities/${activityId}`)
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({ status: 'APPROVED' });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('operario solo puede marcar');
  });
});
```

## 📌 Resumen de Cambios Implementados

### Archivos Modificados

1. **`src/enums/index.ts`**
   - ✅ Agregado `UNDER_REVIEW` a `WorkOrderStatus`
   - ✅ **SIMPLIFICADO** `ActivityStatus`: Eliminado `UNDER_REVIEW` (solo 3 estados: PENDING, APPROVED, REJECTED)
   - ✅ Comentarios explicativos en cada estado

2. **`src/controllers/activity.controller.ts`**
   - ✅ Agregado import de `WorkOrderStatus`
   - ✅ Actualizado `create()`: 
     - **VALIDACIÓN UNIVERSAL**: NADIE puede crear si WorkOrder no está `IN_PROGRESS`
     - Mensaje específico si WorkOrder está en `UNDER_REVIEW` sugiriendo devolverla
     - Operarios: validación adicional de asignación
     - Capataces: pueden crear como `APPROVED` directamente
   - ✅ Actualizado `update()`: 
     - **Excepción para aprobación**: Capataces pueden aprobar/rechazar (solo cambiar status) en cualquier momento
     - **VALIDACIÓN UNIVERSAL**: NADIE puede editar contenido si WorkOrder no está `IN_PROGRESS`
     - Bloqueo automático cuando WorkOrder está `UNDER_REVIEW` (congelado)
     - Mantiene inmutabilidad de `APPROVED` y `REJECTED`
     - Mensaje específico sugiriendo devolver orden a `IN_PROGRESS` si necesita editar

3. **`src/controllers/work-order.controller.ts`**
   - ✅ Actualizado `update()`:
     - Validación de que operario sea el asignado
     - Transiciones permitidas: `PENDING` → `IN_PROGRESS` → `UNDER_REVIEW`
     - Operarios solo pueden actualizar campo `status`
     - **Validación al cerrar**: Verifica que todas las actividades estén APPROVED/REJECTED antes de marcar como `COMPLETED`
     - **Reapertura permitida**: Capataz puede devolver de `UNDER_REVIEW` → `IN_PROGRESS` (para agregar actividades faltantes)
     - Mensaje de error descriptivo si hay actividades pendientes

4. **`src/services/activity.service.ts`**
   - ✅ Agregado método `getWorkOrderById()` para validaciones de permisos en el controlador

### Ventajas del Flujo Simplificado

| Aspecto | Antes (2 niveles) | Ahora (1 nivel) |
|---------|-------------------|-----------------|
| **Estados Activity** | 4 (PENDING, UNDER_REVIEW, APPROVED, REJECTED) | 3 (PENDING, APPROVED, REJECTED) |
| **Control** | Doble nivel (Activity + WorkOrder) | ✅ Un solo nivel (WorkOrder) |
| **Claridad** | Confuso (¿qué significa cada combinación?) | ✅ Claro y directo |
| **Clicks operario** | Marcar N actividades + 1 orden | ✅ Solo marcar 1 orden |
| **Auditoría** | Solo al final | ✅ Flexible (en cualquier momento) |
| **Bloqueo** | Manual por actividad | ✅ Automático por WorkOrder |

### Próximos Pasos Recomendados

1. ✅ **Actualizar DTOs** para reflejar que `ActivityStatus` ya no tiene `UNDER_REVIEW`
2. ✅ **Actualizar tests E2E** con nuevo flujo simplificado
3. ✅ **Agregar tests** para validación de cierre de orden (actividades pendientes)
4. ✅ **Actualizar frontend**:
   - Deshabilitar botón "Crear actividad" si WorkOrder no está `IN_PROGRESS`
   - Mostrar badge "CONGELADO" cuando WorkOrder está `UNDER_REVIEW`
   - Lista de actividades pendientes antes de cerrar orden
5. ✅ **Agregar notificaciones** cuando WorkOrder pasa a `UNDER_REVIEW`
6. ✅ **Dashboard capataz**: Vista de actividades pendientes de revisión

---

**Fecha de actualización:** 15 de Noviembre, 2025  
**Versión:** 3.0 - Flujo simplificado con control centralizado en WorkOrder
