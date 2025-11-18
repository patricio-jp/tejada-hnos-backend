# 📊 Diagrama de Flujo - Sistema de Envíos

## 🔄 Flujo Completo de Envío

```
                                 INICIO
                                   |
                                   v
                    +------------------------------+
                    |  Cliente hace POST request   |
                    |  /sale-orders/:id/shipments  |
                    +------------------------------+
                                   |
                                   v
                    +------------------------------+
                    |   DTO Validation             |
                    |   (class-validator)          |
                    +------------------------------+
                                   |
                    +--------------+--------------+
                    |                             |
                   NO                            SI
                    |                             |
                    v                             v
            +---------------+         +-------------------------+
            | Error 400     |         | Validaciones Previas    |
            | Return        |         | - lotDetails no vacío   |
            +---------------+         | - Campos requeridos     |
                                     | - Cantidades > 0        |
                                     +-------------------------+
                                                 |
                                  +--------------+--------------+
                                  |                             |
                                 NO                            SI
                                  |                             |
                                  v                             v
                          +---------------+         +-------------------------+
                          | Error 400     |         | INICIO TRANSACCIÓN      |
                          | Rollback      |         +-------------------------+
                          +---------------+                     |
                                                               v
                                             +--------------------------------+
                                             | 1. Validar SalesOrder          |
                                             |    - Existe                    |
                                             |    - Estado: APROBADA o        |
                                             |      DESPACHADA_PARCIAL        |
                                             +--------------------------------+
                                                               |
                                                +--------------+--------------+
                                                |                             |
                                               NO                            SI
                                                |                             |
                                                v                             v
                                        +---------------+         +-------------------------+
                                        | Error 404/400 |         | 2. Validar Detalles     |
                                        | Rollback      |         |    pertenecen a orden   |
                                        +---------------+         +-------------------------+
                                                                              |
                                                               +--------------+--------------+
                                                               |                             |
                                                              NO                            SI
                                                               |                             |
                                                               v                             v
                                                       +---------------+         +-------------------------+
                                                       | Error 400     |         | 3. Crear SHIPMENT       |
                                                       | Rollback      |         |    (cabecera)           |
                                                       +---------------+         +-------------------------+
                                                                                             |
                                                                                             v
                                                                        +------------------------------------+
                                                                        | 4. LOOP: Para cada lotDetail       |
                                                                        +------------------------------------+
                                                                                             |
                                                                                             v
                                                                        +------------------------------------+
                                                                        | 4.1. Cargar y Validar HarvestLot   |
                                                                        |      - Existe                      |
                                                                        |      - Estado: EN_STOCK            |
                                                                        |      - Tiene netWeightKg           |
                                                                        |      - Stock suficiente            |
                                                                        |      - Variedad coincide           |
                                                                        |      - Calibre coincide            |
                                                                        +------------------------------------+
                                                                                             |
                                                                              +--------------+--------------+
                                                                              |                             |
                                                                             NO                            SI
                                                                              |                             |
                                                                              v                             v
                                                                      +---------------+         +-------------------------+
                                                                      | Error 400/404 |         | 4.2. Validar            |
                                                                      | Rollback      |         |      SalesOrderDetail   |
                                                                      +---------------+         |      - Existe           |
                                                                                               |      - Cantidad válida   |
                                                                                               +-------------------------+
                                                                                                            |
                                                                                             +--------------+--------------+
                                                                                             |                             |
                                                                                            NO                            SI
                                                                                             |                             |
                                                                                             v                             v
                                                                                     +---------------+         +-------------------------+
                                                                                     | Error 400     |         | 4.3. Crear              |
                                                                                     | Rollback      |         |      ShipmentLotDetail  |
                                                                                     +---------------+         +-------------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                          +----------------------------------+
                                                                                                          | 4.4. Actualizar HarvestLot       |
                                                                                                          |      remainingNetWeightKg -= qty |
                                                                                                          |      Si <= 0: status = VENDIDO   |
                                                                                                          +----------------------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                          +----------------------------------+
                                                                                                          | 4.5. Actualizar SalesOrderDetail |
                                                                                                          |      quantityShipped += qty      |
                                                                                                          |      Calcular pendiente          |
                                                                                                          |      Actualizar status           |
                                                                                                          +----------------------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                                 +-------------------+
                                                                                                                 | Más lotDetails?   |
                                                                                                                 +-------------------+
                                                                                                                           |
                                                                                                            +--------------+--------------+
                                                                                                            |                             |
                                                                                                           SI                            NO
                                                                                                            |                             |
                                                                                                            |                             v
                                                                                                            |              +------------------------------------+
                                                                                                            |              | 5. Actualizar SalesOrder           |
                                                                                                            |              |    Si todas líneas COMPLETA:       |
                                                                                                            |              |      status = DESPACHADA_TOTAL     |
                                                                                                            |              |    Si alguna DESPACHADA_PARCIAL:   |
                                                                                                            |              |      status = DESPACHADA_PARCIAL   |
                                                                                                            |              +------------------------------------+
                                                                                                            |                             |
                                                                                                            +-----------------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                                  +-------------------+
                                                                                                                  | COMMIT            |
                                                                                                                  +-------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                          +----------------------------------+
                                                                                                          | 6. Retornar Shipment creado      |
                                                                                                          |    con todas las relaciones      |
                                                                                                          +----------------------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                                  +-------------------+
                                                                                                                  | Response 201      |
                                                                                                                  | Created           |
                                                                                                                  +-------------------+
                                                                                                                           |
                                                                                                                           v
                                                                                                                         FIN
```

---

## 📊 Diagrama de Estados

### Estados de SalesOrderDetail

```
    PENDIENTE
        |
        | (primer envío parcial)
        v
DESPACHADA_PARCIAL
        |
        | (envío completa cantidad)
        v
    COMPLETA
```

### Estados de SalesOrder

```
    APROBADA
        |
        | (primer envío de cualquier línea)
        v
DESPACHADA_PARCIAL
        |
        | (todas las líneas completas)
        v
DESPACHADA_TOTAL
```

### Estados de HarvestLot

```
PENDIENTE_PROCESO
        |
        | (se establece netWeightKg)
        v
    EN_STOCK
        |
        | (envíos parciales)
        | (remainingNetWeightKg > 0)
        v
    EN_STOCK
        |
        | (remainingNetWeightKg = 0)
        v
    VENDIDO
```

---

## 🔗 Relaciones entre Entidades

```
         Customer
             |
             | 1:N
             v
        SalesOrder ----------------------> Shipment
             |                                |
             | 1:N                            | 1:N
             v                                v
    SalesOrderDetail <-------------- ShipmentLotDetail
                                             |
                                             | N:1
                                             v
                                        HarvestLot
                                             |
                                             | N:1
                                             v
                                           Plot
                                             |
                                             | N:1
                                             v
                                           Field
```

---

## 📦 Flujo de Datos en una Transacción

```
┌─────────────────────────────────────────────────────────┐
│                    TRANSACCIÓN                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. CREATE                                               │
│     ┌───────────┐                                        │
│     │ Shipment  │  (cabecera)                           │
│     └───────────┘                                        │
│                                                          │
│  2. CREATE (por cada lotDetail)                          │
│     ┌───────────────────┐                               │
│     │ ShipmentLotDetail │  (vínculo)                    │
│     └───────────────────┘                               │
│                                                          │
│  3. UPDATE (por cada lote usado)                         │
│     ┌─────────────┐                                      │
│     │ HarvestLot  │  remainingNetWeightKg -= qty        │
│     │             │  status (si se agota)               │
│     └─────────────┘                                      │
│                                                          │
│  4. UPDATE (por cada línea del pedido)                   │
│     ┌──────────────────┐                                │
│     │ SalesOrderDetail │  quantityShipped += qty        │
│     │                  │  status (según pendiente)      │
│     └──────────────────┘                                │
│                                                          │
│  5. UPDATE (orden completa)                              │
│     ┌─────────────┐                                      │
│     │ SalesOrder  │  status (según detalles)            │
│     └─────────────┘                                      │
│                                                          │
│  Si TODO OK → COMMIT                                     │
│  Si CUALQUIER ERROR → ROLLBACK (todo se revierte)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Ejemplo Visual - Envío Parcial

### Estado Inicial

```
┌─────────────────────────┐       ┌──────────────────────┐
│    SalesOrder           │       │    HarvestLot        │
│    ID: SO-001           │       │    ID: H-5           │
│    Status: APROBADA     │       │    Code: H-001       │
├─────────────────────────┤       │    Status: EN_STOCK  │
│  SalesOrderDetail       │       │    netWeightKg: 2500 │
│  ID: SOD-001            │       │    remainingKg: 2500 │
│  Quantity: 1000 kg      │       └──────────────────────┘
│  Shipped: 0 kg          │
│  Status: PENDIENTE      │
└─────────────────────────┘
```

### Después de Envío de 300kg

```
┌─────────────────────────┐       ┌──────────────────────┐
│    SalesOrder           │       │    HarvestLot        │
│    ID: SO-001           │       │    ID: H-5           │
│    Status: DESP_PARCIAL │       │    Code: H-001       │
├─────────────────────────┤       │    Status: EN_STOCK  │
│  SalesOrderDetail       │       │    netWeightKg: 2500 │
│  ID: SOD-001            │       │    remainingKg: 2200 │◄─┐
│  Quantity: 1000 kg      │       └──────────────────────┘  │
│  Shipped: 300 kg        │◄─┐                              │
│  Status: DESP_PARCIAL   │  │                              │
└─────────────────────────┘  │    ┌──────────────────────┐  │
                             │    │   ShipmentLotDetail  │  │
        ┌────────────────────┤    │   ID: SLD-001        │  │
        │    Shipment        │    │   Quantity: 300 kg   │──┤
        │    ID: SH-001      │───►│   harvestLotId: H-5  │──┘
        │    Date: 2025-..   │    │   orderDetailId: ... │
        └────────────────────┘    └──────────────────────┘
```

---

## 🔍 Casos de Error y Rollback

### Caso 1: Stock Insuficiente

```
REQUEST                     VALIDACIÓN                  RESULTADO
  ↓                             ↓                           ↓
Enviar 3000kg         remainingKg = 2500kg        ❌ ERROR 400
                      3000 > 2500                 🔄 ROLLBACK
                                                  📝 NO se crea nada
```

### Caso 2: Variedad Incorrecta

```
REQUEST                     VALIDACIÓN                  RESULTADO
  ↓                             ↓                           ↓
Lote: Chandler         Pedido: Serr                  ❌ ERROR 400
                       Chandler ≠ Serr               🔄 ROLLBACK
                                                     📝 NO se crea nada
```

### Caso 3: Múltiples Lotes - Error en el 2do

```
REQUEST                     PROCESAMIENTO               RESULTADO
  ↓                             ↓                           ↓
Lote 1: 300kg OK       ✅ Detalle 1 creado           ❌ ERROR 400
Lote 2: 9999kg         ❌ Stock insuficiente         🔄 ROLLBACK TOTAL
                       ⚠️ Detalle 1 revertido        📝 NO se crea NADA
```

---

## ✅ Resumen Visual de Garantías

```
┌───────────────────────────────────────────────────────┐
│                  GARANTÍAS DEL SISTEMA                 │
├───────────────────────────────────────────────────────┤
│                                                        │
│  ✅ ATOMICIDAD                                        │
│     Todo se guarda o nada se guarda                   │
│                                                        │
│  ✅ CONSISTENCIA                                      │
│     Estados siempre sincronizados                     │
│                                                        │
│  ✅ AISLAMIENTO                                       │
│     Transacciones no interfieren entre sí             │
│                                                        │
│  ✅ DURABILIDAD                                       │
│     Una vez confirmado, cambios permanentes           │
│                                                        │
│  ✅ VALIDACIÓN EXHAUSTIVA                             │
│     10+ validaciones antes de confirmar               │
│                                                        │
│  ✅ ROLLBACK AUTOMÁTICO                               │
│     Error en cualquier punto = revertir todo          │
│                                                        │
└───────────────────────────────────────────────────────┘
```

---

**Fin del Diagrama de Flujo** 📊
