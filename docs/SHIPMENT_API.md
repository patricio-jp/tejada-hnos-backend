# 📦 API de Envíos (Shipments)

## Descripción General

La API de envíos permite ejecutar envíos de mercadería desde lotes de cosecha hacia órdenes de venta, actualizando automáticamente todos los inventarios y estados de manera transaccional.

## Endpoints Disponibles

### 1. Crear un Envío

**POST** `/api/sale-orders/:salesOrderId/shipments`

Crea un nuevo envío para una orden de venta específica.

#### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body
```json
{
  "trackingNumber": "TRACK-001",
  "notes": "Envío urgente",
  "lotDetails": [
    {
      "harvestLotId": "uuid-lote-1",
      "salesOrderDetailId": "uuid-linea-pedido-1",
      "quantityTakenKg": 300
    },
    {
      "harvestLotId": "uuid-lote-2",
      "salesOrderDetailId": "uuid-linea-pedido-2",
      "quantityTakenKg": 500
    }
  ]
}
```

#### Respuesta Exitosa (201 Created)
```json
{
  "message": "Envío creado exitosamente",
  "data": {
    "id": "uuid-shipment",
    "salesOrderId": "uuid-sales-order",
    "trackingNumber": "TRACK-001",
    "notes": "Envío urgente",
    "shipmentDate": "2025-11-18T15:30:00.000Z",
    "salesOrder": {
      "id": "uuid-sales-order",
      "status": "DESPACHADA_PARCIAL",
      "customer": {
        "id": "uuid-customer",
        "businessName": "Cliente SA"
      }
    },
    "lotDetails": [
      {
        "id": "uuid-lot-detail-1",
        "quantityTakenKg": 300,
        "harvestLot": {
          "id": "uuid-lote-1",
          "lotCode": "H-001",
          "varietyName": "Chandler",
          "caliber": "LARGE",
          "remainingNetWeightKg": 2200
        },
        "salesOrderDetail": {
          "id": "uuid-linea-pedido-1",
          "variety": "Chandler",
          "caliber": "LARGE",
          "quantityKg": 1000,
          "quantityShipped": 300,
          "status": "DESPACHADA_PARCIAL"
        }
      }
    ]
  }
}
```

---

### 2. Obtener Todos los Envíos

**GET** `/api/shipments`

Obtiene todos los envíos registrados.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "message": "Envíos obtenidos exitosamente",
  "data": [
    {
      "id": "uuid-shipment",
      "salesOrderId": "uuid-sales-order",
      "trackingNumber": "TRACK-001",
      "shipmentDate": "2025-11-18T15:30:00.000Z",
      "salesOrder": {
        "id": "uuid-sales-order",
        "status": "DESPACHADA_TOTAL",
        "customer": {
          "businessName": "Cliente SA"
        }
      },
      "lotDetails": [...]
    }
  ]
}
```

---

### 3. Obtener un Envío por ID

**GET** `/api/shipments/:id`

Obtiene un envío específico con todos sus detalles.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "message": "Envío obtenido exitosamente",
  "data": {
    "id": "uuid-shipment",
    "salesOrderId": "uuid-sales-order",
    "trackingNumber": "TRACK-001",
    "notes": "Envío urgente",
    "shipmentDate": "2025-11-18T15:30:00.000Z",
    "salesOrder": {...},
    "lotDetails": [...]
  }
}
```

---

### 4. Obtener Envíos de una Orden de Venta

**GET** `/api/sale-orders/:salesOrderId/shipments`

Obtiene todos los envíos asociados a una orden de venta específica.

#### Headers
```
Authorization: Bearer <token>
```

#### Respuesta Exitosa (200 OK)
```json
{
  "message": "Envíos obtenidos exitosamente",
  "data": [
    {
      "id": "uuid-shipment-1",
      "shipmentDate": "2025-11-18T15:30:00.000Z",
      "lotDetails": [...]
    },
    {
      "id": "uuid-shipment-2",
      "shipmentDate": "2025-11-19T10:00:00.000Z",
      "lotDetails": [...]
    }
  ]
}
```

---

## Lógica Transaccional

### Validaciones Previas
1. La orden de venta debe existir y estar en estado `APROBADA` o `DESPACHADA_PARCIAL`
2. Todos los `salesOrderDetailId` deben pertenecer a la orden de venta
3. Los lotes de cosecha deben estar en estado `EN_STOCK`
4. Los lotes deben tener `netWeightKg` y `remainingNetWeightKg` definidos
5. El stock disponible en cada lote debe ser >= a la cantidad solicitada
6. La variedad y calibre del lote deben coincidir con el detalle del pedido
7. La cantidad a enviar no debe exceder la cantidad pendiente del pedido

### Proceso de Envío (Transaccional)

Para cada detalle de lote en el array `lotDetails`:

1. **Crear ShipmentLotDetail**: Vincula el envío, el lote y el detalle del pedido
2. **Actualizar Inventario**: `harvestLot.remainingNetWeightKg -= quantityTakenKg`
3. **Actualizar Estado del Lote**: Si `remainingNetWeightKg <= 0`, cambiar a `VENDIDO`
4. **Actualizar Cantidad Enviada**: `salesOrderDetail.quantityShipped += quantityTakenKg`
5. **Actualizar Estado del Detalle**:
   - Si `quantityKg - quantityShipped == 0` → `COMPLETA`
   - Si `quantityKg - quantityShipped > 0` → `DESPACHADA_PARCIAL`

6. **Actualizar Estado de la Orden**:
   - Si todas las líneas están `COMPLETA` → `DESPACHADA_TOTAL`
   - Si alguna línea está `DESPACHADA_PARCIAL` → `DESPACHADA_PARCIAL`

---

## Escenarios de Ejemplo

### Escenario 1: Envío Parcial (300kg de 1000kg)

**Orden de Venta**: 1000kg de Chandler LARGE  
**Lote Disponible**: H-5 con 2500kg

**Request:**
```json
POST /api/sale-orders/uuid-order/shipments
{
  "lotDetails": [
    {
      "harvestLotId": "uuid-H-5",
      "salesOrderDetailId": "uuid-detail",
      "quantityTakenKg": 300
    }
  ]
}
```

**Resultado:**
- ✅ Shipment creado
- ✅ Lote H-5: `remainingNetWeightKg` = 2200kg (2500 - 300)
- ✅ SalesOrderDetail: `quantityShipped` = 300kg, estado = `DESPACHADA_PARCIAL`
- ✅ SalesOrder: estado = `DESPACHADA_PARCIAL`

---

### Escenario 2: Completar el Envío (700kg restantes)

**Request:**
```json
POST /api/sale-orders/uuid-order/shipments
{
  "lotDetails": [
    {
      "harvestLotId": "uuid-H-5",
      "salesOrderDetailId": "uuid-detail",
      "quantityTakenKg": 700
    }
  ]
}
```

**Resultado:**
- ✅ Shipment creado
- ✅ Lote H-5: `remainingNetWeightKg` = 1500kg (2200 - 700)
- ✅ SalesOrderDetail: `quantityShipped` = 1000kg, estado = `COMPLETA`
- ✅ SalesOrder: estado = `DESPACHADA_TOTAL` (si todas las líneas están completas)

---

### Escenario 3: Error - Stock Insuficiente

**Request:**
```json
POST /api/sale-orders/uuid-order/shipments
{
  "lotDetails": [
    {
      "harvestLotId": "uuid-H-5",
      "salesOrderDetailId": "uuid-detail",
      "quantityTakenKg": 3000
    }
  ]
}
```

**Respuesta (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Stock insuficiente en Lote H-5. Disponible: 1500.00 kg, Solicitado: 3000.00 kg"
}
```

**Resultado:**
- ❌ No se crea ningún registro (rollback)
- ❌ No se modifica el inventario
- ❌ No se actualizan los estados

---

### Escenario 4: Error - Variedad Incorrecta

**Request:**
```json
POST /api/sale-orders/uuid-order/shipments
{
  "lotDetails": [
    {
      "harvestLotId": "uuid-H-10",  // Lote de variedad "Serr"
      "salesOrderDetailId": "uuid-detail",  // Pedido requiere "Chandler"
      "quantityTakenKg": 300
    }
  ]
}
```

**Respuesta (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "El lote H-10 es de variedad \"Serr\", pero el pedido requiere \"Chandler\""
}
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa (GET) |
| 201 | Created - Envío creado exitosamente |
| 400 | Bad Request - Error de validación o stock insuficiente |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos para esta operación |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Permisos Requeridos

Todos los endpoints requieren autenticación y uno de los siguientes roles:
- `ADMIN`
- `CAPATAZ`

---

## Notas Importantes

1. **Transaccionalidad**: Si alguna validación falla, se hace rollback completo (no se crea ningún registro)
2. **Atomicidad**: Todos los lotes se procesan en una sola transacción
3. **Consistencia**: Los estados se actualizan automáticamente según las reglas de negocio
4. **Trazabilidad**: Cada envío queda registrado con fecha y detalles completos
5. **Validación de Producto**: Se valida que el lote coincida en variedad y calibre con el pedido

---

## Testing con Thunder Client / Postman

### 1. Login
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### 2. Crear Envío
```http
POST http://localhost:3000/sale-orders/{{salesOrderId}}/shipments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "trackingNumber": "TRACK-001",
  "notes": "Envío de prueba",
  "lotDetails": [
    {
      "harvestLotId": "{{harvestLotId}}",
      "salesOrderDetailId": "{{salesOrderDetailId}}",
      "quantityTakenKg": 300
    }
  ]
}
```

### 3. Obtener Envíos de una Orden
```http
GET http://localhost:3000/sale-orders/{{salesOrderId}}/shipments
Authorization: Bearer {{token}}
```

### 4. Obtener Todos los Envíos
```http
GET http://localhost:3000/shipments
Authorization: Bearer {{token}}
```

### 5. Obtener un Envío por ID
```http
GET http://localhost:3000/shipments/{{shipmentId}}
Authorization: Bearer {{token}}
```
