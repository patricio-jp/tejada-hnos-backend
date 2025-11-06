# 🗄️ Modelo de Datos

## Índice
- [Diagrama Entidad-Relación](#diagrama-entidad-relación)
- [Convenciones Generales](#convenciones-generales)
- [Entidades del Sistema](#entidades-del-sistema)
- [Relaciones entre Entidades](#relaciones-entre-entidades)
- [Índices y Constraints](#índices-y-constraints)

---

## Diagrama Entidad-Relación

Ver el diagrama completo en: **[diagrama-er.mmd](./FLUJOS/diagrama-er.mmd)**

### Vista Simplificada por Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE USUARIOS                       │
│  ┌──────┐                                                   │
│  │ User │ (Admin, Capataz, Operario)                        │
│  └──────┘                                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE PRODUCCIÓN                     │
│  ┌───────┐    ┌──────┐    ┌─────────┐    ┌──────────────┐ │
│  │ Field │───→│ Plot │───→│ Variety │    │ Harvest Lot  │ │
│  └───────┘    └──────┘    └─────────┘    └──────────────┘ │
│      ↓           ↓                              ↑          │
│  (manager)   (workOrders)                   (from plot)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  MÓDULO DE OPERACIONES                      │
│  ┌────────────┐    ┌──────────┐    ┌────────────┐         │
│  │ Work Order │───→│ Activity │───→│Input Usage │         │
│  └────────────┘    └──────────┘    └────────────┘         │
│       ↓                                    ↓               │
│   (assignedTo)                          (input)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MÓDULO DE COMPRAS                       │
│  ┌──────────┐   ┌────────────────┐   ┌──────────────────┐ │
│  │ Supplier │→  │ Purchase Order │→  │Purchase Order    │ │
│  └──────────┘   └────────────────┘   │Detail            │ │
│                         ↓             └──────────────────┘ │
│                  ┌──────────────┐          ↓               │
│                  │Goods Receipt │→  ┌──────────────────┐  │
│                  └──────────────┘   │Goods Receipt     │  │
│                                     │Detail            │  │
│                                     └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MÓDULO DE VENTAS                        │
│  ┌──────────┐   ┌────────────┐   ┌──────────────────┐     │
│  │ Customer │→  │Sales Order │→  │Sales Order Detail│     │
│  └──────────┘   └────────────┘   └──────────────────┘     │
│                       ↓                                     │
│                  ┌──────────┐    ┌──────────────────────┐  │
│                  │ Shipment │───→│Shipment Lot Detail   │  │
│                  └──────────┘    └──────────────────────┘  │
│                                           ↓                 │
│                                    (harvestLot)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE INSUMOS                        │
│  ┌───────┐                                                  │
│  │ Input │ (Conecta con Purchase Orders e Input Usages)    │
│  └───────┘                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Convenciones Generales

### Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Nombres de tablas | snake_case, plural | `purchase_orders` |
| Columnas en TypeScript | camelCase | `createdAt` |
| Columnas en DB | snake_case | `created_at` |
| Primary Keys | UUID v4 | `id` |
| Foreign Keys | `{entity}Id` | `supplierId` |

### Campos Estándar

Todas las entidades incluyen:

```typescript
@PrimaryGeneratedColumn('uuid')
id: string;

@CreateDateColumn()
createdAt: Date;

@UpdateDateColumn()
updatedAt: Date;

@DeleteDateColumn()
deletedAt: Date | null;  // Para soft delete
```

### Tipos de Datos Comunes

| Tipo TypeORM | Tipo PostgreSQL | Uso |
|--------------|----------------|-----|
| `uuid` | `uuid` | IDs únicos |
| `varchar` | `varchar` | Textos cortos |
| `text` | `text` | Textos largos |
| `decimal(10,2)` | `numeric(10,2)` | Cantidades, precios |
| `date` | `date` | Fechas sin hora |
| `timestamp` | `timestamp with time zone` | Fechas con hora (UTC) |
| `jsonb` | `jsonb` | Datos estructurados (GeoJSON, detalles) |
| `enum` | `enum` | Estados, tipos definidos |

---

## Entidades del Sistema

### 1. User (users)

**Propósito**: Gestión de usuarios del sistema con diferentes roles.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `email` | varchar | Email del usuario | UNIQUE, NOT NULL |
| `name` | varchar | Nombre | NOT NULL |
| `lastName` | varchar | Apellido | NOT NULL |
| `role` | enum | Rol del usuario (ADMIN, CAPATAZ, OPERARIO) | NOT NULL, DEFAULT: OPERARIO |
| `passwordHash` | varchar | Hash de contraseña (bcrypt) | NOT NULL, SELECT: false |
| `hourlyRate` | decimal(10,2) | Costo por hora para reportes | DEFAULT: 0 |

**Relaciones:**
- **1:N** → `WorkOrder` (assignedWorkOrders)
- **1:N** → `Field` (managedFields)

**Índices:**
- `email` (UNIQUE)

**Notas:**
- El campo `passwordHash` nunca se debe exponer en APIs
- `hourlyRate` se usa para cálculos de costos en reportes

---

### 2. Field (fields)

**Propósito**: Representa un campo o predio agrícola completo.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre del campo | NOT NULL |
| `area` | decimal | Superficie total en hectáreas | NOT NULL |
| `address` | varchar | Dirección física | NOT NULL |
| `location` | jsonb | Polígono GeoJSON del campo | NOT NULL |
| `managerId` | uuid | ID del capataz a cargo | FK → users.id, NULLABLE |

**Relaciones:**
- **N:1** → `User` (manager) - Capataz asignado
- **1:N** → `Plot` (plots) - Parcelas del campo

**Tipo GeoJSON:**
```typescript
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];  // [[[lng, lat], ...]]
}
```

**Notas:**
- Un campo puede tener múltiples parcelas
- Solo usuarios con rol CAPATAZ o ADMIN pueden ser managers
- La suma de áreas de plots debe ser ≤ area del field

---

### 3. Plot (plots)

**Propósito**: Parcela o cuartel dentro de un campo, unidad básica de cultivo.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre de la parcela | NOT NULL |
| `area` | decimal | Superficie en hectáreas | NOT NULL |
| `varietyId` | uuid | Variedad cultivada | FK → varieties.id, NULLABLE |
| `datePlanted` | date | Fecha de plantación | NULLABLE |
| `location` | jsonb | Polígono GeoJSON de la parcela | NOT NULL |
| `fieldId` | uuid | Campo al que pertenece | FK → fields.id, NOT NULL |

**Relaciones:**
- **N:1** → `Field` (field)
- **N:1** → `Variety` (variety)
- **N:M** → `WorkOrder` (workOrders) - Tabla intermedia: `work_order_plots`
- **1:N** → `HarvestLot` (harvestLots)

**Notas:**
- Una parcela solo puede tener una variedad a la vez
- La ubicación geográfica debe estar dentro del polígono del field

---

### 4. Variety (varieties)

**Propósito**: Variedades de nueces cultivadas.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre de la variedad | UNIQUE, NOT NULL |
| `description` | text | Descripción y características | NULLABLE |

**Relaciones:**
- **1:N** → `Plot` (plots)

**Índices:**
- `name` (UNIQUE)

**Ejemplos:**
- Chandler
- Serr
- Hartley
- Franquette

---

### 5. WorkOrder (work_orders)

**Propósito**: Órdenes de trabajo asignadas a operarios para realizar en parcelas específicas.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `title` | varchar | Título de la orden | NOT NULL |
| `description` | text | Descripción detallada | NOT NULL |
| `scheduledDate` | timestamp | Fecha programada de inicio | NOT NULL |
| `dueDate` | timestamp | Fecha límite | NOT NULL |
| `completedDate` | timestamp | Fecha de finalización real | NULLABLE |
| `status` | enum | Estado de la OT | NOT NULL, DEFAULT: PENDING |
| `assignedToId` | uuid | Operario asignado | FK → users.id, NULLABLE |

**Estados (WorkOrderStatus):**
- `PENDING` - Creada, pendiente de asignar/iniciar
- `IN_PROGRESS` - En ejecución
- `COMPLETED` - Completada
- `CANCELLED` - Cancelada

**Relaciones:**
- **N:1** → `User` (assignedTo)
- **N:M** → `Plot` (plots)
- **1:N** → `Activity` (activities)

**Reglas de Negocio:**
- Solo puede ser creada por ADMIN o CAPATAZ
- El operario asignado debe tener rol OPERARIO
- Las parcelas deben pertenecer a campos gestionados por el capataz (si no es ADMIN)

---

### 6. Activity (activities)

**Propósito**: Actividades reales ejecutadas como parte de una orden de trabajo.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `workOrderId` | uuid | Orden de trabajo relacionada | FK → work_orders.id, NOT NULL |
| `type` | enum | Tipo de actividad | NOT NULL |
| `status` | enum | Estado de aprobación | NOT NULL, DEFAULT: PENDING |
| `executionDate` | timestamp | Fecha de ejecución | NOT NULL |
| `hoursWorked` | decimal(5,2) | Horas trabajadas | DEFAULT: 0 |
| `details` | jsonb | Detalles adicionales | DEFAULT: {} |

**Tipos de Actividad (ActivityType):**
- `PODA` - Poda de árboles
- `RIEGO` - Riego
- `APLICACION` - Aplicación de productos
- `COSECHA` - Cosecha
- `MANTENIMIENTO` - Mantenimiento general
- `MONITOREO` - Monitoreo de plagas/enfermedades
- `OTRO` - Otras actividades

**Estados (ActivityStatus):**
- `PENDING` - Creada por OPERARIO, pendiente de aprobación
- `APPROVED` - Aprobada por CAPATAZ/ADMIN
- `REJECTED` - Rechazada por CAPATAZ/ADMIN

**Relaciones:**
- **N:1** → `WorkOrder` (workOrder)
- **1:N** → `InputUsage` (inputsUsed)

**Tipo Details:**
```typescript
interface ActivityDetails {
  observations?: string;
  weather?: string;
  equipment?: string[];
  [key: string]: any;
}
```

**Notas:**
- Las actividades son registradas por el OPERARIO
- Requieren aprobación del CAPATAZ antes de contabilizarse
- Los insumos usados se registran en `InputUsage`

---

### 7. Input (inputs)

**Propósito**: Catálogo de insumos agrícolas (fertilizantes, pesticidas, herramientas, etc.)

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre del insumo | UNIQUE, NOT NULL |
| `unit` | enum | Unidad de medida | NOT NULL |
| `stock` | decimal(10,2) | Stock actual | DEFAULT: 0 |
| `costPerUnit` | decimal(10,2) | Costo promedio por unidad | DEFAULT: 0 |

**Unidades (InputUnit):**
- `KG` - Kilogramos
- `LITRO` - Litros
- `UNIDAD` - Unidades (trampas, herramientas, etc.)

**Relaciones:**
- **1:N** → `InputUsage` (usages)
- **1:N** → `PurchaseOrderDetail` (purchaseOrderDetails)

**Índices:**
- `name` (UNIQUE)

**Notas:**
- El stock se actualiza automáticamente con las recepciones y consumos
- `costPerUnit` se recalcula con cada compra (promedio ponderado)

---

### 8. InputUsage (input_usages)

**Propósito**: Registro de uso de insumos en actividades.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `activityId` | uuid | Actividad donde se usó | FK → activities.id, NOT NULL |
| `inputId` | uuid | Insumo utilizado | FK → inputs.id, NOT NULL |
| `quantityUsed` | decimal(10,2) | Cantidad consumida | NOT NULL |

**Relaciones:**
- **N:1** → `Activity` (activity)
- **N:1** → `Input` (input)

**Notas:**
- La cantidad debe ser > 0
- Al aprobar la actividad, se descuenta del stock del insumo
- Si se rechaza la actividad, no afecta el stock

---

### 9. HarvestLot (harvest_lots)

**Propósito**: Lotes de cosecha para trazabilidad del producto.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `plotId` | uuid | Parcela de origen | FK → plots.id, NOT NULL |
| `harvestDate` | date | Fecha de cosecha | NOT NULL |
| `lotCode` | varchar | Código único del lote | NOT NULL |
| `varietyName` | varchar | Nombre de variedad (snapshot) | NOT NULL |
| `caliber` | enum | Calibre de la nuez | NULLABLE |
| `grossWeightKg` | decimal(10,2) | Peso bruto (húmedo) | NOT NULL |
| `netWeightKg` | decimal(10,2) | Peso neto (seco) | NULLABLE |
| `yieldPercentage` | decimal(5,2) | Rendimiento (neto/bruto)*100 | NULLABLE |
| `status` | enum | Estado del lote | NOT NULL, DEFAULT: PENDIENTE_PROCESO |

**Estados (HarvestLotStatus):**
- `PENDIENTE_PROCESO` - Recién cosechado, húmedo (solo peso bruto)
- `EN_STOCK` - Procesado, seco, listo para venta (con peso neto)
- `VENDIDO` - Se vendió todo el stock de este lote

**Calibres (WalnutCaliber):**
- `JUMBO` - Extra grandes
- `LARGE` - Grandes
- `MEDIUM` - Medianas
- `SMALL` - Pequeñas
- `HALVES` - Partidas (mitades)
- `PIECES` - Trozos

**Relaciones:**
- **N:1** → `Plot` (plot)
- **1:N** → `ShipmentLotDetail` (shipmentDetails)

**Reglas de Negocio:**
- Al crear el lote, solo se registra `grossWeightKg` (estado PENDIENTE_PROCESO)
- Después del secado/proceso, se actualiza `netWeightKg` y `caliber` (estado EN_STOCK)
- El `yieldPercentage` se calcula automáticamente: `(netWeightKg / grossWeightKg) * 100`
- `varietyName` es un snapshot del nombre de la variedad (para histórico)

---

### 10. Supplier (suppliers)

**Propósito**: Proveedores de insumos agrícolas.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre del proveedor | NOT NULL |
| `taxId` | varchar | RUT/CUIT/Tax ID | NULLABLE |
| `address` | varchar | Dirección | NULLABLE |
| `contactEmail` | varchar | Email de contacto | NULLABLE |
| `phoneNumber` | varchar | Teléfono | NULLABLE |

**Relaciones:**
- **1:N** → `PurchaseOrder` (purchaseOrders)

---

### 11. PurchaseOrder (purchase_orders)

**Propósito**: Órdenes de compra de insumos a proveedores.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `supplierId` | uuid | Proveedor | FK → suppliers.id, NOT NULL |
| `status` | enum | Estado de la orden | NOT NULL, DEFAULT: PENDIENTE |
| `totalAmount` | decimal(10,2) | Monto total | NOT NULL |

**Estados (PurchaseOrderStatus):**
- `PENDIENTE` - Recién creada
- `APROBADA` - Aprobada por gerencia, lista para recibir
- `RECIBIDA_PARCIAL` - Recepción parcial registrada
- `RECIBIDA` - Mercadería recibida totalmente
- `CERRADA` - Completada y cerrada
- `CANCELADA` - Cancelada

**Relaciones:**
- **N:1** → `Supplier` (supplier)
- **1:N** → `PurchaseOrderDetail` (details)
- **1:N** → `GoodsReceipt` (receipts)

**Reglas de Negocio:**
- Solo puede ser creada por ADMIN o CAPATAZ
- `totalAmount` se calcula automáticamente: Σ(quantity * unitPrice)
- Solo se puede editar si está en estado PENDIENTE
- Solo ADMIN puede aprobar (cambiar a APROBADA)

---

### 12. PurchaseOrderDetail (purchase_order_details)

**Propósito**: Líneas de detalle de una orden de compra.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `purchaseOrderId` | uuid | Orden de compra | FK → purchase_orders.id, NOT NULL |
| `inputId` | uuid | Insumo a comprar | FK → inputs.id, NOT NULL |
| `quantity` | decimal(10,2) | Cantidad pedida | NOT NULL |
| `unitPrice` | decimal(10,2) | Precio unitario de compra | NOT NULL |

**Relaciones:**
- **N:1** → `PurchaseOrder` (purchaseOrder)
- **N:1** → `Input` (input)
- **1:N** → `GoodsReceiptDetail` (receiptDetails)

**Métodos Virtuales:**
```typescript
quantityReceived: number;     // Σ de receiptDetails.quantityReceived
quantityPending: number;      // quantity - quantityReceived
isFullyReceived: boolean;     // quantityPending <= 0
```

---

### 13. GoodsReceipt (goods_receipts)

**Propósito**: Registro de recepción de mercadería de una orden de compra.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `purchaseOrderId` | uuid | Orden de compra | FK → purchase_orders.id, NOT NULL |
| `receivedById` | uuid | Usuario que recibió | FK → users.id, NOT NULL |
| `receivedAt` | timestamp | Fecha/hora de recepción | DEFAULT: NOW() |
| `notes` | text | Observaciones generales | NULLABLE |

**Relaciones:**
- **N:1** → `PurchaseOrder` (purchaseOrder)
- **N:1** → `User` (receivedBy)
- **1:N** → `GoodsReceiptDetail` (details)

**Notas:**
- Una PurchaseOrder puede tener múltiples GoodsReceipts (recepciones parciales)
- `receivedAt` se guarda en UTC

---

### 14. GoodsReceiptDetail (goods_receipt_details)

**Propósito**: Detalle de cantidades recibidas por insumo.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `goodsReceiptId` | uuid | Recepción | FK → goods_receipts.id, NOT NULL |
| `purchaseOrderDetailId` | uuid | Detalle de orden | FK → purchase_order_details.id, NOT NULL |
| `quantityReceived` | decimal(10,2) | Cantidad recibida | NOT NULL |
| `notes` | text | Notas específicas | NULLABLE |

**Relaciones:**
- **N:1** → `GoodsReceipt` (goodsReceipt)
- **N:1** → `PurchaseOrderDetail` (purchaseOrderDetail)

**Reglas de Negocio:**
- La suma de `quantityReceived` no puede superar el `quantity` del PurchaseOrderDetail
- Al guardar, se actualiza el stock del Input correspondiente
- Se actualiza el estado de la PurchaseOrder automáticamente

---

### 15. Customer (customers)

**Propósito**: Clientes compradores de producto terminado.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `name` | varchar | Nombre del cliente | NOT NULL |
| `taxId` | varchar | RUT/CUIT/Tax ID | NULLABLE |
| `address` | varchar | Dirección | NULLABLE |
| `contactEmail` | varchar | Email de contacto | NULLABLE |
| `phoneNumber` | varchar | Teléfono | NULLABLE |

**Relaciones:**
- **1:N** → `SalesOrder` (salesOrders)

**Estado:** ⏳ Pendiente de implementación

---

### 16. SalesOrder (sales_orders)

**Propósito**: Órdenes de venta de producto terminado a clientes.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `customerId` | uuid | Cliente | FK → customers.id, NOT NULL |
| `status` | enum | Estado de la orden | NOT NULL, DEFAULT: PENDIENTE |

**Estados (SalesOrderStatus):**
- `PENDIENTE` - Presupuesto enviado
- `APROBADA` - Cliente confirmó, listo para despachar
- `DESPACHADA_PARCIAL` - Envío parcial
- `DESPACHADA_TOTAL` - Totalmente enviada
- `PAGADA` - Pago recibido
- `CERRADA` - Completada (archivada)
- `CANCELADA` - Cancelada

**Relaciones:**
- **N:1** → `Customer` (customer)
- **1:N** → `SalesOrderDetail` (details)
- **1:N** → `Shipment` (shipments)

**Estado:** ⏳ Pendiente de implementación

---

### 17. SalesOrderDetail (sales_order_details)

**Propósito**: Líneas de detalle de una orden de venta.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `salesOrderId` | uuid | Orden de venta | FK → sales_orders.id, NOT NULL |
| `caliber` | varchar | Calibre del producto | NOT NULL |
| `variety` | varchar | Variedad | NOT NULL |
| `unitPrice` | decimal(10,2) | Precio por kg | NOT NULL |
| `quantityKg` | decimal(10,2) | Cantidad en kg | NOT NULL |
| `quantityShipped` | decimal(10,2) | Cantidad ya enviada | DEFAULT: 0 |
| `status` | enum | Estado del detalle | NOT NULL, DEFAULT: PENDIENTE |

**Estados (SalesOrderDetailStatus):**
- `PENDIENTE` - No despachado
- `DESPACHADA_PARCIAL` - Parcialmente despachado
- `COMPLETA` - Totalmente despachado

**Relaciones:**
- **N:1** → `SalesOrder` (salesOrder)

**Estado:** ⏳ Pendiente de implementación

---

### 18. Shipment (shipments)

**Propósito**: Despachos/envíos de producto a clientes.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `salesOrderId` | uuid | Orden de venta | FK → sales_orders.id, NOT NULL |
| `trackingNumber` | varchar | Número de seguimiento | NULLABLE |
| `notes` | text | Observaciones | NULLABLE |
| `shipmentDate` | timestamp | Fecha de envío | DEFAULT: NOW() |

**Relaciones:**
- **N:1** → `SalesOrder` (salesOrder)
- **1:N** → `ShipmentLotDetail` (lotDetails)

**Notas:**
- Un SalesOrder puede tener múltiples Shipments (envíos parciales)
- Cada shipment asocia lotes de cosecha específicos

**Estado:** ⏳ Pendiente de implementación

---

### 19. ShipmentLotDetail (shipment_lot_details)

**Propósito**: Trazabilidad - qué lotes se usaron en cada envío.

**Campos:**

| Campo | Tipo | Descripción | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Identificador único | PK |
| `shipmentId` | uuid | Envío | FK → shipments.id, NOT NULL |
| `harvestLotId` | uuid | Lote de cosecha | FK → harvest_lots.id, NOT NULL |
| `salesOrderDetailId` | uuid | Detalle de orden de venta | FK → sales_order_details.id, NOT NULL |
| `quantityTakenKg` | decimal(10,2) | Cantidad tomada del lote | NOT NULL |

**Relaciones:**
- **N:1** → `Shipment` (shipment)
- **N:1** → `HarvestLot` (harvestLot)
- **N:1** → `SalesOrderDetail` (salesOrderDetail)

**Reglas de Negocio:**
- Permite trazabilidad completa desde cliente hasta parcela
- La suma de `quantityTakenKg` por lote no puede superar el `netWeightKg` disponible
- Al crear, se actualiza `quantityShipped` en SalesOrderDetail

**Estado:** ⏳ Pendiente de implementación

---

## Relaciones entre Entidades

### Relaciones Principales

```
User (1) ─────→ (N) WorkOrder [assignedTo]
User (1) ─────→ (N) Field [manager]

Field (1) ────→ (N) Plot
Plot (N) ─────→ (1) Variety
Plot (N) ─────→ (M) WorkOrder [many-to-many via work_order_plots]
Plot (1) ─────→ (N) HarvestLot

WorkOrder (1) → (N) Activity
Activity (1) ─→ (N) InputUsage
InputUsage (N) → (1) Input

Supplier (1) ─→ (N) PurchaseOrder
PurchaseOrder (1) → (N) PurchaseOrderDetail
PurchaseOrderDetail (N) → (1) Input
PurchaseOrder (1) → (N) GoodsReceipt
GoodsReceipt (1) → (N) GoodsReceiptDetail
GoodsReceiptDetail (N) → (1) PurchaseOrderDetail

Customer (1) ─→ (N) SalesOrder
SalesOrder (1) → (N) SalesOrderDetail
SalesOrder (1) → (N) Shipment
Shipment (1) ─→ (N) ShipmentLotDetail
ShipmentLotDetail (N) → (1) HarvestLot
ShipmentLotDetail (N) → (1) SalesOrderDetail
```

### Tabla Intermedia (Many-to-Many)

**work_order_plots**
- `work_order_id` (FK → work_orders.id)
- `plot_id` (FK → plots.id)
- PK: (work_order_id, plot_id)

---

## Índices y Constraints

### Índices Únicos

- `users.email`
- `inputs.name`
- `varieties.name`

### Índices de Búsqueda Recomendados

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_work_orders_assigned_to ON work_orders(assigned_to_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_harvest_lots_plot ON harvest_lots(plot_id);
CREATE INDEX idx_harvest_lots_status ON harvest_lots(status);
CREATE INDEX idx_activities_work_order ON activities(work_order_id);
CREATE INDEX idx_fields_manager ON fields(manager_id);

-- Soft delete
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_fields_deleted_at ON fields(deleted_at) WHERE deleted_at IS NULL;
-- ... (repetir para todas las tablas con soft delete)
```

### Constraints de Integridad

Todas las FK incluyen:
```sql
ON DELETE RESTRICT  -- No permitir borrar si hay referencias
ON UPDATE CASCADE   -- Actualizar en cascada (por si cambia el ID)
```

Excepciones:
- `Field.managerId`: `ON DELETE SET NULL` (si se borra el manager, el campo queda sin asignar)
- `WorkOrder.assignedToId`: `ON DELETE SET NULL`

---

## Notas Importantes

### Soft Delete

- Todas las entidades usan soft delete (`deletedAt`)
- Los queries deben filtrar `WHERE deletedAt IS NULL` (TypeORM lo hace automáticamente)
- Para hard delete, hay endpoints específicos (solo ADMIN)

### Timestamps en UTC

- Todos los timestamps se guardan en UTC
- La conversión a timezone local se hace en el frontend
- Usar `timestamp with time zone` en PostgreSQL

### Validaciones a Nivel de Aplicación

Las validaciones complejas se hacen en la capa de servicios:
- Stock suficiente al registrar uso de insumos
- Fechas lógicas (dueDate > scheduledDate)
- Permisos según rol y campo gestionado
- Cantidades recibidas vs cantidades pedidas

---

**Próximo paso**: Consultar los diagramas de flujo en [FLUJOS/](./FLUJOS/) para entender cómo interactúan estas entidades.
