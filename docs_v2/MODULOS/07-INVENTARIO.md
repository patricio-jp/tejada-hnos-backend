# 📊 Módulo de Inventario

## Índice
- [Descripción General](#descripción-general)
- [Conceptos Clave](#conceptos-clave)
- [Gestión de Stock](#gestión-de-stock)
- [Endpoints](#endpoints)
- [Reportes](#reportes)
- [Casos de Uso](#casos-de-uso)
- [Reglas de Negocio](#reglas-de-negocio)

---

## Descripción General

El módulo de inventario gestiona el stock de dos tipos de productos:
1. **Insumos (Inputs)**: Fertilizantes, pesticidas, etc.
2. **Lotes de Cosecha (HarvestLots)**: Nueces disponibles para venta

Este módulo **no tiene entidades propias**, sino que consume y reporta sobre las entidades de otros módulos.

### Características Principales

- ⏳ **Stock de Insumos** - Control de entradas/salidas
- ⏳ **Stock de Nueces** - Disponibilidad por calibre
- ⏳ **Movimientos** - Historial de cambios
- ⏳ **Alertas** - Stock bajo, vencimientos
- ⏳ **Valorización** - Costo de inventario
- ⏳ **Reportes** - Dashboards y estadísticas

### Estado

⏳ **PENDIENTE DE IMPLEMENTACIÓN**

> **Nota para desarrolladores:** Este módulo es principalmente de reporting y consultas sobre entidades existentes (Input, HarvestLot). Se recomienda implementar después de completar Ventas.

---

## Conceptos Clave

### 1. Stock de Insumos

Los insumos se gestionan en la entidad `Input`:

```typescript
@Entity('inputs')
export class Input {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentStock: number; // Stock actual
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumStock: number; // Stock mínimo (alerta)
}
```

**Movimientos de Stock:**
- **Entrada:** Ajuste manual (compra de insumos)
- **Salida:** Uso en Activity (InputUsage)

---

### 2. Stock de Nueces

Los lotes de nueces se gestionan en `HarvestLot`:

```typescript
@Entity('harvest_lots')
export class HarvestLot {
  @Column({ type: 'enum', enum: WalnutCaliber })
  caliber: WalnutCaliber; // CHANDLER, SERR, etc.
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number; // Cantidad disponible (kg)
  
  @Column({ type: 'enum', enum: HarvestLotStatus })
  status: HarvestLotStatus; // IN_STOCK, PROCESSING, SOLD
  
  @Column({ type: 'enum', enum: HarvestLotSource })
  source: HarvestLotSource; // HARVEST, PURCHASE
}
```

**Movimientos de Stock:**
- **Entrada:** 
  - Registro de cosecha (source: HARVEST)
  - Recepción de compra (source: PURCHASE)
- **Salida:** 
  - Envío a cliente (ShipmentLotDetail)

---

## Gestión de Stock

### Stock de Insumos

#### Consultar Stock Actual

```typescript
interface InputStockDto {
  id: string;
  name: string;
  unit: InputUnit;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  stockValue: number; // currentStock * unitCost
  status: 'OK' | 'LOW' | 'OUT_OF_STOCK';
}

const getInputStock = async (): Promise<InputStockDto[]> => {
  const inputs = await inputRepo.find({
    where: { deletedAt: IsNull() }
  });
  
  return inputs.map(input => ({
    id: input.id,
    name: input.name,
    unit: input.unit,
    currentStock: input.currentStock,
    minimumStock: input.minimumStock,
    unitCost: input.unitCost,
    stockValue: input.currentStock * input.unitCost,
    status: input.currentStock === 0 
      ? 'OUT_OF_STOCK'
      : input.currentStock < input.minimumStock
        ? 'LOW'
        : 'OK'
  }));
};
```

---

#### Movimientos de Insumos

```typescript
interface InputMovement {
  date: Date;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  relatedEntity?: string; // ActivityId, etc.
}

const getInputMovements = async (
  inputId: string,
  startDate?: Date,
  endDate?: Date
): Promise<InputMovement[]> => {
  // Movimientos de salida (uso en actividades)
  const usages = await inputUsageRepo.find({
    where: {
      inputId,
      activity: {
        activityDate: Between(startDate, endDate)
      }
    },
    relations: ['activity']
  });
  
  const movements: InputMovement[] = usages.map(usage => ({
    date: usage.activity.activityDate,
    type: 'OUT',
    quantity: usage.quantity,
    reason: `Usado en actividad ${usage.activity.activityType}`,
    relatedEntity: usage.activityId
  }));
  
  // TODO: Agregar movimientos de entrada (cuando se implementen)
  
  return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
};
```

---

### Stock de Nueces

#### Consultar Stock por Calibre

```typescript
interface HarvestLotStockDto {
  caliber: WalnutCaliber;
  totalQuantity: number;
  lotCount: number;
  bySource: {
    HARVEST: number;
    PURCHASE: number;
  };
  averageAge: number; // días desde cosecha/compra
}

const getHarvestLotStock = async (): Promise<HarvestLotStockDto[]> => {
  const lots = await harvestLotRepo.find({
    where: { 
      status: HarvestLotStatus.IN_STOCK,
      quantity: MoreThan(0)
    }
  });
  
  const groupedByCaliber = lots.reduce((acc, lot) => {
    if (!acc[lot.caliber]) {
      acc[lot.caliber] = {
        caliber: lot.caliber,
        totalQuantity: 0,
        lotCount: 0,
        bySource: { HARVEST: 0, PURCHASE: 0 },
        totalAge: 0
      };
    }
    
    acc[lot.caliber].totalQuantity += lot.quantity;
    acc[lot.caliber].lotCount += 1;
    acc[lot.caliber].bySource[lot.source] += lot.quantity;
    
    const age = dayjs().diff(dayjs(lot.harvestDate), 'day');
    acc[lot.caliber].totalAge += age * lot.quantity;
    
    return acc;
  }, {} as Record<WalnutCaliber, any>);
  
  return Object.values(groupedByCaliber).map(group => ({
    caliber: group.caliber,
    totalQuantity: group.totalQuantity,
    lotCount: group.lotCount,
    bySource: group.bySource,
    averageAge: Math.round(group.totalAge / group.totalQuantity)
  }));
};
```

---

#### Movimientos de Lotes

```typescript
interface HarvestLotMovement {
  date: Date;
  type: 'IN' | 'OUT';
  quantity: number;
  lotId: string;
  reason: string;
  relatedEntity?: string;
}

const getHarvestLotMovements = async (
  caliber?: WalnutCaliber,
  startDate?: Date,
  endDate?: Date
): Promise<HarvestLotMovement[]> => {
  const movements: HarvestLotMovement[] = [];
  
  // Movimientos de entrada (cosechas y compras)
  const incomingLots = await harvestLotRepo.find({
    where: {
      caliber,
      harvestDate: Between(startDate, endDate)
    },
    relations: ['variety', 'supplier']
  });
  
  movements.push(...incomingLots.map(lot => ({
    date: lot.harvestDate,
    type: 'IN' as const,
    quantity: lot.quantity,
    lotId: lot.id,
    reason: lot.source === HarvestLotSource.HARVEST
      ? `Cosecha de ${lot.variety.varietyName}`
      : `Compra a ${lot.supplier.name}`,
    relatedEntity: lot.source === HarvestLotSource.HARVEST
      ? lot.varietyId
      : lot.supplierId
  })));
  
  // Movimientos de salida (envíos)
  const shipmentDetails = await shipmentLotDetailRepo.find({
    where: {
      harvestLot: {
        caliber
      },
      shipment: {
        shipmentDate: Between(startDate, endDate)
      }
    },
    relations: ['harvestLot', 'shipment', 'shipment.salesOrder', 'shipment.salesOrder.customer']
  });
  
  movements.push(...shipmentDetails.map(detail => ({
    date: detail.shipment.shipmentDate,
    type: 'OUT' as const,
    quantity: detail.quantity,
    lotId: detail.harvestLotId,
    reason: `Envío a ${detail.shipment.salesOrder.customer.name}`,
    relatedEntity: detail.shipmentId
  })));
  
  return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
};
```

---

## Endpoints

### 📦 Inventory Inputs

#### GET /inventory/inputs

Obtener stock de insumos.

**Autorización:** Autenticado

**Query Parameters:**
- `status` (string): OK | LOW | OUT_OF_STOCK
- `includeValue` (boolean): Incluir valorización

**Request:**
```
GET /inventory/inputs?status=LOW
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "summary": {
    "totalItems": 15,
    "okStock": 10,
    "lowStock": 4,
    "outOfStock": 1,
    "totalValue": 12500.00
  },
  "items": [
    {
      "id": "input-uuid-1",
      "name": "Fertilizante NPK 20-10-10",
      "unit": "KILOGRAM",
      "currentStock": 45.00,
      "minimumStock": 50.00,
      "unitCost": 1.50,
      "stockValue": 67.50,
      "status": "LOW"
    },
    {
      "id": "input-uuid-2",
      "name": "Insecticida Orgánico",
      "unit": "LITER",
      "currentStock": 3.00,
      "minimumStock": 5.00,
      "unitCost": 12.00,
      "stockValue": 36.00,
      "status": "LOW"
    },
    {
      "id": "input-uuid-3",
      "name": "Herbicida",
      "unit": "LITER",
      "currentStock": 0.00,
      "minimumStock": 10.00,
      "unitCost": 8.50,
      "stockValue": 0.00,
      "status": "OUT_OF_STOCK"
    }
  ]
}
```

---

#### GET /inventory/inputs/:id/movements

Obtener movimientos de un insumo.

**Autorización:** Autenticado

**Query Parameters:**
- `startDate` (date): Desde fecha
- `endDate` (date): Hasta fecha

**Request:**
```
GET /inventory/inputs/input-uuid-1/movements?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "input": {
    "id": "input-uuid-1",
    "name": "Fertilizante NPK 20-10-10",
    "currentStock": 45.00
  },
  "movements": [
    {
      "date": "2025-01-25T00:00:00.000Z",
      "type": "OUT",
      "quantity": 50.00,
      "reason": "Usado en actividad FERTILIZATION",
      "relatedEntity": "activity-uuid-5"
    },
    {
      "date": "2025-01-15T00:00:00.000Z",
      "type": "OUT",
      "quantity": 30.00,
      "reason": "Usado en actividad FERTILIZATION",
      "relatedEntity": "activity-uuid-3"
    },
    {
      "date": "2025-01-10T00:00:00.000Z",
      "type": "IN",
      "quantity": 100.00,
      "reason": "Compra de reposición",
      "relatedEntity": null
    }
  ]
}
```

---

### 🌰 Inventory Harvest Lots

#### GET /inventory/harvest-lots

Obtener stock de nueces por calibre.

**Autorización:** Autenticado

**Query Parameters:**
- `caliber` (enum): Filtrar por calibre
- `source` (enum): HARVEST | PURCHASE

**Request:**
```
GET /inventory/harvest-lots
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "summary": {
    "totalQuantity": 5600.00,
    "totalLots": 12,
    "avgAge": 45
  },
  "byCaliber": [
    {
      "caliber": "CHANDLER",
      "totalQuantity": 2500.00,
      "lotCount": 5,
      "bySource": {
        "HARVEST": 1800.00,
        "PURCHASE": 700.00
      },
      "averageAge": 38
    },
    {
      "caliber": "SERR",
      "totalQuantity": 1800.00,
      "lotCount": 4,
      "bySource": {
        "HARVEST": 1300.00,
        "PURCHASE": 500.00
      },
      "averageAge": 52
    },
    {
      "caliber": "HOWARD",
      "totalQuantity": 1300.00,
      "lotCount": 3,
      "bySource": {
        "HARVEST": 1300.00,
        "PURCHASE": 0.00
      },
      "averageAge": 41
    }
  ]
}
```

---

#### GET /inventory/harvest-lots/movements

Obtener movimientos de lotes de cosecha.

**Autorización:** Autenticado

**Query Parameters:**
- `caliber` (enum): Filtrar por calibre
- `startDate` (date): Desde fecha
- `endDate` (date): Hasta fecha

**Request:**
```
GET /inventory/harvest-lots/movements?caliber=CHANDLER&startDate=2025-01-01
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "caliber": "CHANDLER",
  "movements": [
    {
      "date": "2025-03-15T00:00:00.000Z",
      "type": "IN",
      "quantity": 1800.00,
      "lotId": "hl-uuid-1",
      "reason": "Cosecha de CHANDLER",
      "relatedEntity": "variety-uuid-1"
    },
    {
      "date": "2025-01-20T00:00:00.000Z",
      "type": "IN",
      "quantity": 500.00,
      "lotId": "hl-uuid-2",
      "reason": "Compra a Proveedor García",
      "relatedEntity": "supplier-uuid-1"
    },
    {
      "date": "2025-01-25T00:00:00.000Z",
      "type": "OUT",
      "quantity": 1000.00,
      "lotId": "hl-uuid-1",
      "reason": "Envío a Distribuidora Norte SA",
      "relatedEntity": "shipment-uuid-1"
    }
  ]
}
```

---

#### GET /inventory/harvest-lots/available

Consultar lotes disponibles para venta (con FIFO).

**Autorización:** Autenticado

**Query Parameters:**
- `caliber` (enum): Calibre requerido
- `quantity` (number): Cantidad necesaria

**Request:**
```
GET /inventory/harvest-lots/available?caliber=CHANDLER&quantity=1000
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "caliber": "CHANDLER",
  "requestedQuantity": 1000.00,
  "availableQuantity": 2500.00,
  "canFulfill": true,
  "suggestedLots": [
    {
      "id": "hl-uuid-3",
      "quantity": 800.00,
      "harvestDate": "2025-02-10",
      "source": "HARVEST",
      "age": 35,
      "variety": {
        "varietyName": "CHANDLER",
        "plot": {
          "plotNumber": "N-01",
          "field": {
            "name": "Campo Norte"
          }
        }
      }
    },
    {
      "id": "hl-uuid-4",
      "quantity": 200.00,
      "harvestDate": "2025-02-15",
      "source": "HARVEST",
      "age": 30,
      "variety": {
        "varietyName": "CHANDLER",
        "plot": {
          "plotNumber": "N-02",
          "field": {
            "name": "Campo Norte"
          }
        }
      }
    }
  ]
}
```

---

## Reportes

### 1. Dashboard de Inventario

```typescript
interface InventoryDashboard {
  inputs: {
    total: number;
    ok: number;
    low: number;
    outOfStock: number;
    totalValue: number;
  };
  harvestLots: {
    totalQuantity: number;
    totalLots: number;
    avgAge: number;
    bySource: {
      HARVEST: number;
      PURCHASE: number;
    };
  };
  alerts: Array<{
    type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OLD_LOT';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    relatedEntity: string;
  }>;
}

const getInventoryDashboard = async (): Promise<InventoryDashboard> => {
  // Inputs summary
  const inputs = await getInputStock();
  const inputsSummary = {
    total: inputs.length,
    ok: inputs.filter(i => i.status === 'OK').length,
    low: inputs.filter(i => i.status === 'LOW').length,
    outOfStock: inputs.filter(i => i.status === 'OUT_OF_STOCK').length,
    totalValue: inputs.reduce((sum, i) => sum + i.stockValue, 0)
  };
  
  // Harvest lots summary
  const lots = await getHarvestLotStock();
  const lotsSummary = {
    totalQuantity: lots.reduce((sum, l) => sum + l.totalQuantity, 0),
    totalLots: lots.reduce((sum, l) => sum + l.lotCount, 0),
    avgAge: Math.round(
      lots.reduce((sum, l) => sum + (l.averageAge * l.totalQuantity), 0) /
      lots.reduce((sum, l) => sum + l.totalQuantity, 0)
    ),
    bySource: {
      HARVEST: lots.reduce((sum, l) => sum + l.bySource.HARVEST, 0),
      PURCHASE: lots.reduce((sum, l) => sum + l.bySource.PURCHASE, 0)
    }
  };
  
  // Alerts
  const alerts: any[] = [];
  
  // Input alerts
  inputs.filter(i => i.status === 'OUT_OF_STOCK').forEach(input => {
    alerts.push({
      type: 'OUT_OF_STOCK',
      severity: 'HIGH',
      message: `Insumo ${input.name} sin stock`,
      relatedEntity: input.id
    });
  });
  
  inputs.filter(i => i.status === 'LOW').forEach(input => {
    alerts.push({
      type: 'LOW_STOCK',
      severity: 'MEDIUM',
      message: `Stock bajo de ${input.name}: ${input.currentStock} ${input.unit}`,
      relatedEntity: input.id
    });
  });
  
  // Old lot alerts (>90 días)
  const allLots = await harvestLotRepo.find({
    where: { status: HarvestLotStatus.IN_STOCK }
  });
  
  allLots.filter(lot => {
    const age = dayjs().diff(dayjs(lot.harvestDate), 'day');
    return age > 90;
  }).forEach(lot => {
    alerts.push({
      type: 'OLD_LOT',
      severity: 'LOW',
      message: `Lote ${lot.id} tiene ${dayjs().diff(dayjs(lot.harvestDate), 'day')} días`,
      relatedEntity: lot.id
    });
  });
  
  return {
    inputs: inputsSummary,
    harvestLots: lotsSummary,
    alerts
  };
};
```

---

### 2. Valorización de Inventario

```typescript
interface InventoryValuation {
  inputs: {
    totalValue: number;
    byCategory: Array<{
      unit: InputUnit;
      count: number;
      value: number;
    }>;
  };
  harvestLots: {
    totalValue: number;
    byCaliber: Array<{
      caliber: WalnutCaliber;
      quantity: number;
      avgCost: number;
      totalValue: number;
    }>;
  };
  total: number;
}

const getInventoryValuation = async (): Promise<InventoryValuation> => {
  // Inputs valuation
  const inputs = await inputRepo.find({
    where: { deletedAt: IsNull() }
  });
  
  const inputsValue = {
    totalValue: inputs.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0),
    byCategory: Object.values(InputUnit).map(unit => {
      const filtered = inputs.filter(i => i.unit === unit);
      return {
        unit,
        count: filtered.length,
        value: filtered.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0)
      };
    })
  };
  
  // Harvest lots valuation (usando precio promedio ponderado)
  const lots = await harvestLotRepo
    .createQueryBuilder('hl')
    .leftJoin('hl.variety', 'variety')
    .leftJoin('hl.supplier', 'supplier')
    .leftJoin('goods_receipt_details', 'grd', 'grd.harvestLotId = hl.id')
    .select('hl.caliber', 'caliber')
    .addSelect('SUM(hl.quantity)', 'totalQuantity')
    .addSelect('AVG(grd.unitPrice)', 'avgCost')
    .where('hl.status = :status', { status: HarvestLotStatus.IN_STOCK })
    .groupBy('hl.caliber')
    .getRawMany();
  
  const lotsValue = {
    totalValue: lots.reduce((sum, l) => 
      sum + (Number(l.totalQuantity) * Number(l.avgCost || 0)), 0
    ),
    byCaliber: lots.map(l => ({
      caliber: l.caliber,
      quantity: Number(l.totalQuantity),
      avgCost: Number(l.avgCost || 0),
      totalValue: Number(l.totalQuantity) * Number(l.avgCost || 0)
    }))
  };
  
  return {
    inputs: inputsValue,
    harvestLots: lotsValue,
    total: inputsValue.totalValue + lotsValue.totalValue
  };
};
```

---

## Casos de Uso

### Caso 1: Verificar Stock antes de Crear Orden de Venta

**Actor:** ADMIN

**Flujo:**
1. Cliente solicita 1000 kg de CHANDLER
2. ADMIN consulta stock disponible
3. Sistema muestra disponibilidad y lotes sugeridos (FIFO)

**Código:**
```typescript
const checkStockBeforeSale = async () => {
  const available = await inventoryService.getAvailableLots({
    caliber: WalnutCaliber.CHANDLER,
    quantity: 1000
  });
  
  if (!available.canFulfill) {
    console.log(`
      ⚠️ Stock insuficiente
      Solicitado: ${available.requestedQuantity} kg
      Disponible: ${available.availableQuantity} kg
      Faltante: ${available.requestedQuantity - available.availableQuantity} kg
    `);
    return;
  }
  
  console.log(`
    ✅ Stock disponible
    Lotes sugeridos (FIFO):
    ${available.suggestedLots.map(lot => `
      - ${lot.quantity} kg (${lot.age} días)
        ${lot.source === 'HARVEST' 
          ? `Campo: ${lot.variety.plot.field.name}`
          : `Proveedor: ${lot.supplier.name}`}
    `).join('\n')}
  `);
};
```

---

### Caso 2: Alerta de Stock Bajo de Insumos

**Actor:** Sistema (automático) → ADMIN notificado

**Flujo:**
1. Sistema ejecuta check diario
2. Detecta insumos con stock bajo
3. Envía notificación a ADMIN

**Código:**
```typescript
const checkLowStockAlerts = async () => {
  const dashboard = await inventoryService.getDashboard();
  
  const highAlerts = dashboard.alerts.filter(a => a.severity === 'HIGH');
  const mediumAlerts = dashboard.alerts.filter(a => a.severity === 'MEDIUM');
  
  if (highAlerts.length > 0 || mediumAlerts.length > 0) {
    await notificationService.send({
      to: 'admin@tejadahnos.com',
      subject: `⚠️ Alertas de Inventario (${highAlerts.length} críticas)`,
      body: `
        ALERTAS CRÍTICAS:
        ${highAlerts.map(a => `- ${a.message}`).join('\n')}
        
        ALERTAS MEDIAS:
        ${mediumAlerts.map(a => `- ${a.message}`).join('\n')}
      `
    });
  }
};
```

---

### Caso 3: Reporte de Rotación de Inventario

**Actor:** ADMIN

**Flujo:**
1. ADMIN solicita reporte mensual
2. Sistema calcula rotación de lotes
3. Identifica lotes con baja rotación

**Código:**
```typescript
const getInventoryRotationReport = async (month: number, year: number) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Movimientos del mes
  const movements = await getHarvestLotMovements(undefined, startDate, endDate);
  
  const inQuantity = movements
    .filter(m => m.type === 'IN')
    .reduce((sum, m) => sum + m.quantity, 0);
  
  const outQuantity = movements
    .filter(m => m.type === 'OUT')
    .reduce((sum, m) => sum + m.quantity, 0);
  
  // Stock promedio
  const currentStock = await getHarvestLotStock();
  const avgStock = currentStock.reduce((sum, s) => sum + s.totalQuantity, 0);
  
  // Rotación = Salidas / Stock Promedio
  const rotation = outQuantity / (avgStock || 1);
  
  console.log(`
    📊 REPORTE DE ROTACIÓN - ${month}/${year}
    
    Entradas: ${inQuantity} kg
    Salidas: ${outQuantity} kg
    Stock Promedio: ${avgStock} kg
    Índice de Rotación: ${rotation.toFixed(2)}
    
    ${rotation < 0.5 
      ? '⚠️ Rotación baja - Revisar estrategia de ventas'
      : '✅ Rotación normal'}
  `);
};
```

---

## Reglas de Negocio

### 1. Stock Mínimo de Insumos

```typescript
/**
 * Definir stock mínimo basado en consumo promedio
 */

const calculateMinimumStock = async (inputId: string): Promise<number> => {
  // Consumo promedio de los últimos 3 meses
  const threeMonthsAgo = dayjs().subtract(3, 'month').toDate();
  
  const usages = await inputUsageRepo.find({
    where: {
      inputId,
      activity: {
        activityDate: MoreThanOrEqual(threeMonthsAgo)
      }
    },
    relations: ['activity']
  });
  
  const totalUsed = usages.reduce((sum, u) => sum + u.quantity, 0);
  const avgMonthlyUsage = totalUsed / 3;
  
  // Stock mínimo = 1.5 meses de consumo promedio
  return avgMonthlyUsage * 1.5;
};
```

---

### 2. FIFO para Lotes de Cosecha

```typescript
/**
 * Seleccionar lotes más antiguos primero
 */

const selectLotsWithFIFO = async (
  caliber: WalnutCaliber,
  quantity: number
): Promise<HarvestLot[]> => {
  const lots = await harvestLotRepo.find({
    where: {
      caliber,
      status: HarvestLotStatus.IN_STOCK,
      quantity: MoreThan(0)
    },
    order: {
      harvestDate: 'ASC' // Más antiguo primero
    }
  });
  
  const selected: HarvestLot[] = [];
  let remaining = quantity;
  
  for (const lot of lots) {
    if (remaining <= 0) break;
    selected.push(lot);
    remaining -= lot.quantity;
  }
  
  return selected;
};
```

---

### 3. Valorización por Precio Promedio Ponderado

```typescript
/**
 * Calcular costo promedio de lotes en stock
 */

const getWeightedAverageCost = async (caliber: WalnutCaliber): Promise<number> => {
  const lots = await harvestLotRepo.find({
    where: {
      caliber,
      status: HarvestLotStatus.IN_STOCK
    },
    relations: ['goodsReceiptDetail']
  });
  
  let totalCost = 0;
  let totalQuantity = 0;
  
  for (const lot of lots) {
    if (lot.goodsReceiptDetail) {
      totalCost += lot.goodsReceiptDetail.unitPrice * lot.quantity;
      totalQuantity += lot.quantity;
    }
  }
  
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};
```

---

## Mejoras Futuras

- [ ] Predicción de demanda con ML
- [ ] Optimización de stock (punto de reorden)
- [ ] Trazabilidad de lotes por número de serie
- [ ] Códigos QR para lotes
- [ ] Integración con balanzas automáticas
- [ ] Dashboard en tiempo real
- [ ] Alertas configurables por usuario
- [ ] Exportación de reportes (Excel, PDF)
- [ ] Historial de precios de insumos
- [ ] Gestión de vencimientos de insumos

---

**Documentación relacionada:**
- [03-COMPRAS.md](./03-COMPRAS.md) - Entrada de stock (Goods Receipts)
- [04-PRODUCCION.md](./04-PRODUCCION.md) - Entrada de stock (Harvest Lots)
- [05-OPERACIONES.md](./05-OPERACIONES.md) - Salida de insumos (Input Usage)
- [06-VENTAS.md](./06-VENTAS.md) - Salida de stock (Shipments)
- [FLUJOS/flujo-inventario.mmd](../FLUJOS/flujo-inventario.mmd) - Diagrama de flujo
- [API: endpoints-inventory.md](../API/endpoints-inventory.md)
