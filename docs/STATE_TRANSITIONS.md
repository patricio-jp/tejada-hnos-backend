# Validación de Transiciones de Estado

Este documento describe las transiciones de estado permitidas para los módulos de órdenes en el sistema.

## 🔒 Principio de Seguridad

Las transiciones de estado se validan **en el controlador** antes de llegar al servicio, rechazando inmediatamente peticiones que intenten cambios de estado no permitidos. Esto previene:

- Cambios arbitrarios de estado
- Reversión de estados finales
- Saltos en el flujo lógico del negocio

## 📋 Sales Orders (Órdenes de Venta)

### Diagrama de Flujo

```
PENDIENTE → APROBADA → DESPACHADA_PARCIAL → DESPACHADA_TOTAL → PAGADA → CERRADA
    ↓           ↓              ↓
CANCELADA   CANCELADA      CANCELADA
```

### Transiciones Permitidas

| PENDIENTE | APROBADA, CANCELADA |
| APROBADA | DESPACHADA_PARCIAL, DESPACHADA_TOTAL, CANCELADA |
| DESPACHADA_PARCIAL | DESPACHADA_TOTAL, PAGADA, CERRADA ⚠️ |
| DESPACHADA_TOTAL | PAGADA, CERRADA |
| PAGADA | CERRADA |
| CERRADA | *(estado final)* |
| CANCELADA | *(estado final)* |

⚠️ **Nota importante**: Desde `DESPACHADA_PARCIAL` NO se puede cancelar porque ya existen despachos realizados. Solo se puede cerrar (para completar parcialmente) o continuar despachando.

### Notas Importantes

- **DESPACHADA_PARCIAL** y **DESPACHADA_TOTAL** son actualizados automáticamente por el módulo de Shipments
- Solo se puede **CANCELAR** antes de que la orden esté completamente despachada
- Una vez **CERRADA** o **CANCELADA**, no se puede cambiar el estado

### Ejemplo de Uso

```typescript
// ✅ Válido: PENDIENTE → APROBADA
PATCH /sales-orders/:id/status
{ "status": "APROBADA" }

// ❌ Inválido: PENDIENTE → DESPACHADA_TOTAL (debe pasar por APROBADA)
PATCH /sales-orders/:id/status
{ "status": "DESPACHADA_TOTAL" }
// Error: No se puede cambiar el estado de 'PENDIENTE' a 'DESPACHADA_TOTAL'

// ❌ Inválido: CERRADA → PENDIENTE (estado final)
PATCH /sales-orders/:id/status
{ "status": "PENDIENTE" }
// Error: Transiciones permitidas desde 'CERRADA': ninguna (estado final)
```

---

## 📦 Purchase Orders (Órdenes de Compra)

### Diagrama de Flujo

```
PENDIENTE → APROBADA → RECIBIDA_PARCIAL → RECIBIDA → CERRADA
    ↓           ↓              ↓
CANCELADA   CANCELADA      CANCELADA
```

### Transiciones Permitidas

| PENDIENTE | APROBADA, CANCELADA |
| APROBADA | RECIBIDA_PARCIAL, RECIBIDA, CANCELADA |
| RECIBIDA_PARCIAL | RECIBIDA, CERRADA ⚠️ |
| RECIBIDA | CERRADA |
| CERRADA | *(estado final)* |
| CANCELADA | *(estado final)* |

⚠️ **Nota importante**: Desde `RECIBIDA_PARCIAL` NO se puede cancelar porque ya existen recepciones realizadas. Solo se puede cerrar (para completar parcialmente) o continuar recibiendo.

### Notas Importantes

- **RECIBIDA_PARCIAL** y **RECIBIDA** son actualizados automáticamente por el módulo de GoodsReceipt
- Se permite saltar directamente de **APROBADA** a **RECIBIDA** si se recibe todo en un solo lote
- Se puede **CERRAR** desde **RECIBIDA_PARCIAL** si se decide no recibir el resto
- Una vez **CERRADA** o **CANCELADA**, no se puede cambiar el estado

### Ejemplo de Uso

```typescript
// ✅ Válido: PENDIENTE → APROBADA
PATCH /purchase-orders/:id/status
{ "status": "APROBADA" }

// ✅ Válido: APROBADA → RECIBIDA (recepción completa en un solo lote)
PATCH /purchase-orders/:id/status
{ "status": "RECIBIDA" }

// ❌ Inválido: PENDIENTE → RECIBIDA (debe estar APROBADA primero)
PATCH /purchase-orders/:id/status
{ "status": "RECIBIDA" }
// Error: No se puede cambiar el estado de 'PENDIENTE' a 'RECIBIDA'

// ✅ Válido: RECIBIDA_PARCIAL → CERRADA (decisión de no recibir el resto)
PATCH /purchase-orders/:id/status
{ "status": "CERRADA" }
```

---

## 🛠️ Work Orders (Órdenes de Trabajo)

### Diagrama de Flujo

```
PENDING → IN_PROGRESS → UNDER_REVIEW → COMPLETED
   ↓          ↓              ↓
CANCELLED CANCELLED    CANCELLED
                           ↓
                      IN_PROGRESS (reapertura)
```

### Transiciones por Rol

#### OPERARIO (solo su OT asignada)
| Estado Actual | Estados Permitidos |
|--------------|-------------------|
| `PENDING` | `IN_PROGRESS` |
| `IN_PROGRESS` | `UNDER_REVIEW` |
| `UNDER_REVIEW` | *(espera aprobación del capataz)* |

#### CAPATAZ / ADMIN
| Estado Actual | Estados Permitidos |
|--------------|-------------------|
| `PENDING` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `UNDER_REVIEW`, `CANCELLED` |
| `UNDER_REVIEW` | `IN_PROGRESS` (reapertura), `COMPLETED`, `CANCELLED` |
| `COMPLETED` | *(estado final)* |
| `CANCELLED` | *(estado final)* |

### Validaciones Adicionales

- **COMPLETED**: Solo se puede marcar como completada si **todas las actividades** están aprobadas o rechazadas
- **IN_PROGRESS** desde **UNDER_REVIEW**: Permite reapertura para agregar actividades faltantes

---

## 🧪 Testing

Todas las transiciones de estado deben ser probadas en los tests e2e:

```typescript
// Test de transición válida
it('should allow valid state transition', async () => {
  const response = await request(app)
    .patch(`/sales-orders/${orderId}/status`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ status: SalesOrderStatus.APROBADA });
  
  expect(response.status).toBe(200);
  expect(response.body.data.status).toBe(SalesOrderStatus.APROBADA);
});

// Test de transición inválida
it('should reject invalid state transition', async () => {
  const response = await request(app)
    .patch(`/sales-orders/${orderId}/status`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ status: SalesOrderStatus.CERRADA }); // Salto inválido
  
  expect(response.status).toBe(400);
  expect(response.body.errors[0].message).toContain('No se puede cambiar el estado');
});
```

---

## 📝 Implementación

La validación se implementa en los **controladores** siguiendo este patrón:

```typescript
public updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data: UpdateStatusDto = req.body;

    // 1. Obtener la orden actual
    const currentOrder = await this.service.findById(id);

    // 2. Validar transición de estado
    if (data.status !== currentOrder.status) {
      const allowedTransitions: Record<string, OrderStatus[]> = {
        [OrderStatus.PENDIENTE]: [OrderStatus.APROBADA, OrderStatus.CANCELADA],
        // ... más transiciones
      };

      const allowed = allowedTransitions[currentOrder.status] || [];
      
      if (!allowed.includes(data.status)) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          `No se puede cambiar el estado de '${currentOrder.status}' a '${data.status}'. ` +
          `Transiciones permitidas: ${allowed.join(', ') || 'ninguna (estado final)'}`
        );
      }
    }

    // 3. Proceder con la actualización
    const updatedOrder = await this.service.updateStatus(id, data.status);
    
    res.status(StatusCodes.OK).json({ data: updatedOrder });
  } catch (error) {
    next(error);
  }
};
```

---

## 🔐 Beneficios

1. **Seguridad**: Previene manipulaciones arbitrarias de estado
2. **Consistencia**: Garantiza que el flujo de negocio se respete
3. **Claridad**: Los mensajes de error indican qué transiciones son válidas
4. **Mantenibilidad**: La lógica está centralizada y es fácil de modificar
5. **Testing**: Facilita la creación de tests para cada transición

---

## 🔄 Actualizaciones Automáticas

Algunos cambios de estado ocurren automáticamente:

- **SalesOrder**: `DESPACHADA_PARCIAL` y `DESPACHADA_TOTAL` se actualizan al crear Shipments
- **PurchaseOrder**: `RECIBIDA_PARCIAL` y `RECIBIDA` se actualizan al crear GoodsReceipts
- **WorkOrder**: El módulo de Activities puede actualizar estados según aprobaciones

Estos cambios automáticos **no pasan por la validación del controlador** ya que se ejecutan dentro de transacciones controladas por los servicios.
