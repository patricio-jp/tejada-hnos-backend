# 📈 Módulo de Reportes

## Índice
- [Descripción General](#descripción-general)
- [Tipos de Reportes](#tipos-de-reportes)
- [Endpoints](#endpoints)
- [Reportes Detallados](#reportes-detallados)
- [Dashboards](#dashboards)
- [Exportación](#exportación)

---

## Descripción General

El módulo de reportes proporciona análisis, estadísticas y visualizaciones sobre todos los aspectos del negocio: producción, operaciones, compras, ventas, inventario y finanzas.

### Características Principales

- 🔮 **Reportes de Producción** - Rendimiento por campo/variedad
- 🔮 **Reportes de Operaciones** - Actividades, costos de mano de obra
- 🔮 **Reportes de Compras** - Análisis de proveedores, precios
- 🔮 **Reportes de Ventas** - Análisis de clientes, rentabilidad
- 🔮 **Reportes de Inventario** - Rotación, valorización
- 🔮 **Reportes Financieros** - P&L, flujo de caja
- 🔮 **Dashboards** - KPIs en tiempo real
- 🔮 **Exportación** - PDF, Excel, CSV

### Estado

🔮 **FUTURO - NO IMPLEMENTADO**

> **Nota para desarrolladores:** Este módulo se recomienda implementar después de tener todos los módulos operativos (Autenticación, Usuarios, Compras, Producción, Operaciones, Ventas, Inventario).

---

## Tipos de Reportes

### 1. Reportes de Producción

#### 1.1. Producción por Campo

**Descripción:** Analiza la producción de cada campo en un período.

**Datos:**
- Total cosechado por campo (kg)
- Rendimiento por hectárea (kg/ha)
- Distribución por calibre
- Comparación con período anterior
- Costo de producción por kg

**Ejemplo:**
```typescript
interface ProductionByFieldReport {
  period: { startDate: Date; endDate: Date };
  fields: Array<{
    fieldId: string;
    fieldName: string;
    totalArea: number;
    totalProduction: number; // kg
    yieldPerHa: number; // kg/ha
    byCaliber: Record<WalnutCaliber, number>;
    productionCost: number;
    costPerKg: number;
  }>;
}
```

---

#### 1.2. Rendimiento por Variedad

**Descripción:** Compara el rendimiento de diferentes variedades.

**Datos:**
- Producción total por variedad
- Rendimiento promedio (kg/ha)
- Mejor/peor campo por variedad
- Evolución anual

---

#### 1.3. Análisis de Cosecha

**Descripción:** Detalle de cosechas realizadas.

**Datos:**
- Fecha, campo, parcela, variedad
- Cantidad cosechada
- Calibre obtenido
- Personal involucrado
- Horas trabajadas

---

### 2. Reportes de Operaciones

#### 2.1. Actividades Realizadas

**Descripción:** Resumen de actividades por período.

**Datos:**
- Actividades por tipo (poda, riego, fertilización, etc.)
- Horas trabajadas por actividad
- Insumos utilizados
- Costo total de operaciones

**Ejemplo:**
```typescript
interface ActivitiesReport {
  period: { startDate: Date; endDate: Date };
  summary: {
    totalActivities: number;
    totalHours: number;
    totalLaborCost: number;
    totalInputCost: number;
  };
  byType: Array<{
    activityType: ActivityType;
    count: number;
    hours: number;
    cost: number;
  }>;
}
```

---

#### 2.2. Productividad de Operarios

**Descripción:** Análisis de rendimiento de operarios.

**Datos:**
- Horas trabajadas por operario
- Actividades completadas
- Tasa de aprobación/rechazo
- Costo de mano de obra

---

#### 2.3. Uso de Insumos

**Descripción:** Consumo de insumos por período.

**Datos:**
- Insumo utilizado
- Cantidad total
- Costo total
- Actividades donde se usó
- Tendencias de consumo

---

### 3. Reportes de Compras

#### 3.1. Análisis de Proveedores

**Descripción:** Evaluación de proveedores.

**Datos:**
- Volumen comprado por proveedor
- Monto total
- Precio promedio por calibre
- Calidad (rechazos, devoluciones)
- Tiempos de entrega

**Ejemplo:**
```typescript
interface SupplierAnalysisReport {
  period: { startDate: Date; endDate: Date };
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalPurchases: number; // kg
    totalAmount: number; // $
    avgPrice: number; // $/kg
    orders: number;
    onTimeDelivery: number; // %
    qualityScore: number; // 1-10
  }>;
}
```

---

#### 3.2. Evolución de Precios

**Descripción:** Historial de precios de compra.

**Datos:**
- Precio por calibre a lo largo del tiempo
- Precio promedio por proveedor
- Tendencias (alza/baja)
- Predicción de precios (ML)

---

### 4. Reportes de Ventas

#### 4.1. Análisis de Clientes

**Descripción:** Evaluación de clientes.

**Datos:**
- Volumen vendido por cliente
- Monto total
- Frecuencia de compra
- Calibres preferidos
- Rentabilidad por cliente

---

#### 4.2. Ventas por Período

**Descripción:** Análisis de ventas.

**Datos:**
- Total vendido (kg)
- Monto total ($)
- Margen de ganancia
- Comparación con períodos anteriores
- Distribución por calibre

---

### 5. Reportes de Inventario

#### 5.1. Rotación de Inventario

**Descripción:** Análisis de rotación de stock.

**Datos:**
- Índice de rotación por calibre
- Días promedio en inventario
- Lotes con baja rotación
- Stock obsoleto

---

#### 5.2. Valorización de Inventario

**Descripción:** Valor del inventario.

**Datos:**
- Valor total de insumos
- Valor total de lotes de cosecha
- Valor total de inventario
- Comparación con períodos anteriores

---

### 6. Reportes Financieros

#### 6.1. Estado de Resultados (P&L)

**Descripción:** Profit & Loss statement.

**Datos:**
```
Ingresos:
  + Ventas de nueces
  
Costos de Ventas:
  - Costo de producción propia
  - Costo de compra a proveedores
  
Ganancia Bruta

Gastos Operativos:
  - Mano de obra (actividades)
  - Insumos
  - Gastos generales
  
Ganancia Neta
```

---

#### 6.2. Flujo de Caja

**Descripción:** Cash flow analysis.

**Datos:**
- Ingresos por ventas
- Egresos por compras
- Egresos por operaciones
- Saldo neto
- Proyección

---

## Endpoints

### 📊 Production Reports

#### GET /reports/production/by-field

Reporte de producción por campo.

**Autorización:** ADMIN, CAPATAZ (solo sus campos)

**Query Parameters:**
- `startDate` (date): Desde
- `endDate` (date): Hasta
- `fieldId` (uuid): Campo específico (opcional)

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "fields": [
    {
      "fieldId": "field-uuid-1",
      "fieldName": "Campo Norte",
      "totalArea": 50.00,
      "totalProduction": 10000.00,
      "yieldPerHa": 200.00,
      "byCaliber": {
        "CHANDLER": 5000.00,
        "SERR": 3000.00,
        "HOWARD": 2000.00
      },
      "productionCost": 50000.00,
      "costPerKg": 5.00
    }
  ]
}
```

---

### 🛠️ Operations Reports

#### GET /reports/operations/activities

Reporte de actividades realizadas.

**Autorización:** Autenticado

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `activityType` (enum): Filtrar por tipo
- `fieldId` (uuid): Filtrar por campo

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "summary": {
    "totalActivities": 150,
    "totalHours": 600.00,
    "totalLaborCost": 9000.00,
    "totalInputCost": 3500.00
  },
  "byType": [
    {
      "activityType": "PRUNING",
      "count": 45,
      "hours": 180.00,
      "cost": 2700.00
    },
    {
      "activityType": "FERTILIZATION",
      "count": 30,
      "hours": 120.00,
      "cost": 1800.00
    }
  ]
}
```

---

### 🛒 Purchase Reports

#### GET /reports/purchases/suppliers

Análisis de proveedores.

**Autorización:** ADMIN

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "suppliers": [
    {
      "supplierId": "supplier-uuid-1",
      "supplierName": "Proveedor García",
      "totalPurchases": 5000.00,
      "totalAmount": 100000.00,
      "avgPrice": 20.00,
      "orders": 10,
      "onTimeDelivery": 90.00,
      "qualityScore": 8.5
    }
  ]
}
```

---

### 🚚 Sales Reports

#### GET /reports/sales/by-customer

Análisis de ventas por cliente.

**Autorización:** ADMIN

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "customers": [
    {
      "customerId": "customer-uuid-1",
      "customerName": "Distribuidora Norte SA",
      "totalSold": 8000.00,
      "totalAmount": 200000.00,
      "avgPrice": 25.00,
      "orders": 15,
      "frequency": "monthly",
      "profitMargin": 25.00
    }
  ]
}
```

---

### 💰 Financial Reports

#### GET /reports/financial/profit-loss

Estado de resultados (P&L).

**Autorización:** Solo ADMIN

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response (200):**
```json
{
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  },
  "revenue": {
    "sales": 500000.00
  },
  "costOfSales": {
    "ownProduction": 100000.00,
    "purchases": 150000.00,
    "total": 250000.00
  },
  "grossProfit": 250000.00,
  "operatingExpenses": {
    "labor": 50000.00,
    "inputs": 30000.00,
    "general": 20000.00,
    "total": 100000.00
  },
  "netProfit": 150000.00,
  "profitMargin": 30.00
}
```

---

## Dashboards

### Dashboard Principal (Admin)

**KPIs en Tiempo Real:**

```typescript
interface MainDashboard {
  production: {
    currentSeason: number; // kg cosechado esta temporada
    vsLastSeason: number; // % variación
    avgYield: number; // kg/ha promedio
  };
  
  sales: {
    monthToDate: number; // $ vendido este mes
    vsLastMonth: number; // % variación
    topCustomer: { name: string; amount: number };
  };
  
  inventory: {
    totalStock: number; // kg en inventario
    lowStockAlerts: number;
    avgAge: number; // días promedio
  };
  
  operations: {
    activeWorkOrders: number;
    pendingApprovals: number;
    hoursThisWeek: number;
  };
  
  financial: {
    monthlyRevenue: number;
    monthlyCosts: number;
    profitMargin: number; // %
  };
}
```

---

### Dashboard de Producción (CAPATAZ)

**KPIs para CAPATAZ:**

```typescript
interface ProductionDashboard {
  myFields: Array<{
    fieldName: string;
    activeWorkOrders: number;
    thisSeasonProduction: number;
    pendingActivities: number;
  }>;
  
  thisWeek: {
    activitiesCompleted: number;
    activitiesPending: number;
    hoursWorked: number;
  };
  
  alerts: Array<{
    type: 'WORK_ORDER' | 'ACTIVITY' | 'HARVEST';
    message: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}
```

---

## Exportación

### PDF Reports

```typescript
/**
 * Generar reporte en PDF
 */

const generatePDFReport = async (
  reportType: string,
  params: any
): Promise<Buffer> => {
  // Usar librería como PDFKit o Puppeteer
  const pdf = new PDFDocument();
  
  // Agregar contenido según tipo de reporte
  switch (reportType) {
    case 'production-by-field':
      await addProductionByFieldContent(pdf, params);
      break;
    case 'sales-summary':
      await addSalesSummaryContent(pdf, params);
      break;
    // ... otros reportes
  }
  
  return pdf;
};
```

---

### Excel Reports

```typescript
/**
 * Generar reporte en Excel
 */

const generateExcelReport = async (
  reportType: string,
  params: any
): Promise<Buffer> => {
  // Usar librería como ExcelJS
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');
  
  // Agregar datos según tipo de reporte
  switch (reportType) {
    case 'inventory-valuation':
      await addInventoryValuationData(worksheet, params);
      break;
    // ... otros reportes
  }
  
  return await workbook.xlsx.writeBuffer();
};
```

---

## Mejoras Futuras

- [ ] Reportes personalizables (query builder)
- [ ] Gráficos interactivos (Chart.js, D3.js)
- [ ] Suscripción a reportes automáticos (email)
- [ ] Comparación de períodos (year-over-year)
- [ ] Predicciones con Machine Learning
- [ ] Reportes en tiempo real (WebSockets)
- [ ] Exportación a Google Sheets
- [ ] Integración con Power BI / Tableau
- [ ] Reportes móviles (app)
- [ ] Benchmarking con industria

---

**Documentación relacionada:**
- [Todos los módulos](../README.md) - Fuentes de datos para reportes
- [API: endpoints-reports.md](../API/endpoints-reports.md)
