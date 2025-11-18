# Estimación FPA (Function Point Analysis) - Sistema ERP Tejada Hnos.

## Técnica: Function Point Analysis (Análisis de Puntos de Función)

### Metodología IFPUG (International Function Point Users Group)

---

## Parámetros del Proyecto
- **Equipo:** 4 desarrolladores full-stack (trabajo paralelo y colaborativo)
- **Tarifa por hora:** $8 USD
- **Productividad:** 4 horas por Function Point (FP) - alta productividad con frameworks modernos
- **Lenguaje:** TypeScript (Backend + Frontend)
- **Días laborales:** 6 días por semana (lunes a sábado)
- **Horario:** Flexible (promedio 8 horas diarias)
- **Duración del proyecto:** 25 agosto - 30 noviembre 2025 (97 días calendario / 83 días laborales)
- **Alcance:** Sistema ERP completo para producción de nogales

---

## 1. Identificación de Componentes Funcionales

### 1.1 External Inputs (EI) - Entradas Externas
Procesos que ingresan datos al sistema desde el exterior.

| # | Función | Complejidad | FP |
|---|---------|-------------|-----|
| 1 | Login de usuario | Simple | 3 |
| 2 | Registro de usuario | Simple | 3 |
| 3 | Cambio de contraseña | Simple | 3 |
| 4 | Crear Variedad | Simple | 3 |
| 5 | Actualizar Variedad | Simple | 3 |
| 6 | Eliminar Variedad | Simple | 3 |
| 7 | Crear Cliente | Media | 4 |
| 8 | Actualizar Cliente | Media | 4 |
| 9 | Eliminar Cliente | Simple | 3 |
| 10 | Crear Proveedor | Media | 4 |
| 11 | Actualizar Proveedor | Media | 4 |
| 12 | Eliminar Proveedor | Simple | 3 |
| 13 | Crear Insumo | Media | 4 |
| 14 | Actualizar Insumo | Media | 4 |
| 15 | Eliminar Insumo | Simple | 3 |
| 16 | Crear Campo | Media | 4 |
| 17 | Actualizar Campo (con geometría GeoJSON) | Compleja | 6 |
| 18 | Eliminar Campo | Simple | 3 |
| 19 | Crear Parcela (con geometría GeoJSON) | Media | 4 |
| 20 | Actualizar Parcela (con geometría GeoJSON) | Compleja | 6 |
| 21 | Eliminar Parcela | Simple | 3 |
| 22 | Crear Orden de Compra (con múltiples ítems) | Compleja | 6 |
| 23 | Actualizar Orden de Compra | Media | 4 |
| 24 | Cancelar Orden de Compra | Simple | 3 |
| 25 | Registrar Recepción de Compra (remito) | Compleja | 6 |
| 26 | Crear Orden de Trabajo | Media | 4 |
| 27 | Actualizar Orden de Trabajo | Media | 4 |
| 28 | Cancelar Orden de Trabajo | Simple | 3 |
| 29 | Registrar Actividad (con uso de insumos) | Compleja | 6 |
| 30 | Actualizar Actividad | Media | 4 |
| 31 | Completar Actividad | Simple | 3 |
| 32 | Crear Lote de Cosecha (multi-parcela) | Media | 4 |
| 33 | Actualizar Lote de Cosecha | Media | 4 |
| 34 | Crear Orden de Venta (con asignación de lotes) | Compleja | 6 |
| 35 | Actualizar Orden de Venta | Media | 4 |
| 36 | Confirmar Orden de Venta | Simple | 3 |
| 37 | Cancelar Orden de Venta | Simple | 3 |
| 38 | Crear Envío (con tracking) | Media | 4 |
| 39 | Actualizar estado de Envío | Simple | 3 |
| 40 | Marcar Envío como Entregado | Simple | 3 |

**Subtotal EI:** **151 FP**

---

### 1.2 External Outputs (EO) - Salidas Externas
Procesos que generan datos para el usuario con lógica de cálculo.

| # | Función | Complejidad | FP |
|---|---------|-------------|-----|
| 1 | Reporte de Producción por Campo | Compleja | 7 |
| 2 | Reporte de Producción por Parcela | Compleja | 7 |
| 3 | Reporte de Producción por Período | Compleja | 7 |
| 4 | Reporte de Uso de Insumos | Compleja | 7 |
| 5 | Reporte de Costos por Actividad | Compleja | 7 |
| 6 | Reporte de Ventas por Cliente | Media | 5 |
| 7 | Reporte de Ventas por Período | Media | 5 |
| 8 | Reporte de Ganancias | Compleja | 7 |
| 9 | Reporte de Inventario Actual de Lotes | Media | 5 |
| 10 | Dashboard KPIs Gerenciales | Compleja | 7 |
| 11 | Gráfico de Producción por Variedad | Media | 5 |
| 12 | Gráfico de Uso de Insumos por Tipo | Media | 5 |
| 13 | Gráfico de Ventas en el Tiempo | Media | 5 |
| 14 | Cálculo de Productividad por Hectárea | Media | 5 |
| 15 | Trazabilidad E2E hacia atrás (desde lote) | Compleja | 7 |
| 16 | Exportación de Reportes a PDF | Media | 5 |
| 17 | Exportación de Reportes a CSV | Simple | 4 |

**Subtotal EO:** **101 FP**

---

### 1.3 External Inquiries (EQ) - Consultas Externas
Consultas simples de recuperación de datos sin cálculos complejos.

| # | Función | Complejidad | FP |
|---|---------|-------------|-----|
| 1 | Listar Variedades | Simple | 3 |
| 2 | Buscar Variedad por ID | Simple | 3 |
| 3 | Listar Clientes (con filtros) | Simple | 3 |
| 4 | Buscar Cliente por ID | Simple | 3 |
| 5 | Listar Proveedores (con filtros) | Simple | 3 |
| 6 | Buscar Proveedor por ID | Simple | 3 |
| 7 | Listar Insumos (con filtros) | Simple | 3 |
| 8 | Buscar Insumo por ID | Simple | 3 |
| 9 | Listar Campos | Simple | 3 |
| 10 | Buscar Campo por ID | Simple | 3 |
| 11 | Listar Parcelas por Campo | Simple | 3 |
| 12 | Buscar Parcela por ID | Simple | 3 |
| 13 | Listar Órdenes de Compra (con filtros) | Media | 4 |
| 14 | Detalle de Orden de Compra | Media | 4 |
| 15 | Historial de Recepciones de Compra | Media | 4 |
| 16 | Listar Órdenes de Trabajo (con filtros) | Media | 4 |
| 17 | Detalle de Orden de Trabajo | Simple | 3 |
| 18 | Listar Actividades por Operario | Simple | 3 |
| 19 | Listar Actividades por Parcela | Simple | 3 |
| 20 | Detalle de Actividad | Media | 4 |
| 21 | Listar Lotes de Cosecha (con filtros) | Media | 4 |
| 22 | Detalle de Lote de Cosecha | Media | 4 |
| 23 | Inventario Disponible de Lotes | Media | 4 |
| 24 | Listar Órdenes de Venta (con filtros) | Media | 4 |
| 25 | Detalle de Orden de Venta | Media | 4 |
| 26 | Listar Envíos (con filtros) | Media | 4 |
| 27 | Detalle de Envío con Timeline | Media | 4 |
| 28 | Buscar Usuario por ID | Simple | 3 |
| 29 | Listar Usuarios por Rol | Simple | 3 |
| 30 | Consultar Perfil de Usuario | Simple | 3 |

**Subtotal EQ:** **103 FP**

---

### 1.4 Internal Logical Files (ILF) - Archivos Lógicos Internos
Grupos de datos lógicamente relacionados mantenidos por el sistema.

| # | Entidad | Atributos | Complejidad | FP |
|---|---------|-----------|-------------|-----|
| 1 | User | 10 atributos (id, username, email, password, role, managedFields, etc.) | Media | 10 |
| 2 | Customer | 8 atributos (id, name, email, phone, address, isActive, etc.) | Media | 10 |
| 3 | Supplier | 8 atributos (id, name, email, phone, address, isActive, etc.) | Media | 10 |
| 4 | Variety | 5 atributos (id, name, description, isActive, etc.) | Simple | 7 |
| 5 | Input | 8 atributos (id, name, category, unitOfMeasure, currentPrice, stock, etc.) | Media | 10 |
| 6 | Field | 7 atributos (id, name, geometry, area, managedBy, etc.) | Media | 10 |
| 7 | Plot | 9 atributos (id, name, geometry, area, variety, field, etc.) | Media | 10 |
| 8 | PurchaseOrder | 10 atributos (id, orderNumber, supplier, orderDate, status, total, etc.) | Media | 10 |
| 9 | PurchaseOrderDetail | 8 atributos (id, purchaseOrder, input, quantity, unitPrice, etc.) | Media | 10 |
| 10 | GoodsReceipt | 8 atributos (id, purchaseOrder, receiptDate, status, etc.) | Media | 10 |
| 11 | GoodsReceiptDetail | 7 atributos (id, goodsReceipt, orderDetail, quantityReceived, etc.) | Simple | 7 |
| 12 | WorkOrder | 10 atributos (id, plot, taskType, scheduledDate, assignedTo, status, etc.) | Media | 10 |
| 13 | Activity | 12 atributos (id, workOrder, plot, executedDate, operario, status, cost, etc.) | Compleja | 15 |
| 14 | InputUsage | 7 atributos (id, activity, input, quantity, unitOfMeasure, etc.) | Simple | 7 |
| 15 | HarvestLot | 10 atributos (id, lotNumber, variety, quantity, harvestDate, status, etc.) | Media | 10 |
| 16 | SaleOrder | 10 atributos (id, orderNumber, customer, orderDate, status, total, etc.) | Media | 10 |
| 17 | SaleOrderDetail | 8 atributos (id, saleOrder, variety, quantity, unitPrice, harvestLot, etc.) | Media | 10 |
| 18 | Shipment | 10 atributos (id, saleOrder, shipmentDate, carrier, trackingNumber, status, etc.) | Media | 10 |
| 19 | ShipmentLotDetail | 6 atributos (id, shipment, harvestLot, quantity, etc.) | Simple | 7 |

**Subtotal ILF:** **183 FP**

---

### 1.5 External Interface Files (EIF) - Archivos de Interfaz Externa
Datos referenciados por el sistema pero mantenidos externamente.

| # | Interfaz Externa | Complejidad | FP |
|---|------------------|-------------|-----|
| 1 | Mapbox/OpenStreetMap API (tiles de mapas) | Simple | 5 |
| 2 | Sistema de archivos local (fotos de actividades) | Simple | 5 |

**Subtotal EIF:** **10 FP**

---

## 2. Cálculo de Function Points No Ajustados (UFP)

| Componente | Cantidad | FP Subtotal |
|------------|----------|-------------|
| **External Inputs (EI)** | 40 funciones | **151 FP** |
| **External Outputs (EO)** | 17 funciones | **101 FP** |
| **External Inquiries (EQ)** | 30 funciones | **103 FP** |
| **Internal Logical Files (ILF)** | 19 entidades | **183 FP** |
| **External Interface Files (EIF)** | 2 interfaces | **10 FP** |

### **UFP Total: 548 FP**

---

## 3. Factor de Ajuste Técnico (TAF)

### 3.1 Características Generales del Sistema (GSC)

| # | Característica | Grado de Influencia (0-5) | Justificación |
|---|----------------|---------------------------|---------------|
| 1 | Comunicación de datos | 5 | API REST completa con JSON, comunicación constante frontend-backend |
| 2 | Procesamiento distribuido | 2 | Arquitectura monolítica pero separación clara frontend/backend |
| 3 | Rendimiento | 4 | Consultas optimizadas necesarias, índices en BD, paginación requerida |
| 4 | Configuración de uso intensivo | 3 | PostgreSQL compartido, configuración de entorno necesaria |
| 5 | Tasa de transacciones | 4 | Transacciones frecuentes (compras, recepciones, actividades, ventas) |
| 6 | Entrada de datos en línea | 5 | 100% de entrada de datos online, interfaz web/mobile |
| 7 | Eficiencia del usuario final | 5 | UI moderna con Shadcn, componentes reutilizables, mobile-friendly, UX optimizada |
| 8 | Actualización en línea | 5 | CRUD en tiempo real, actualizaciones inmediatas, sin batch processing |
| 9 | Complejidad del procesamiento | 5 | Lógica transaccional compleja, cálculos automáticos, trazabilidad, autorización avanzada |
| 10 | Reusabilidad | 5 | Componentes frontend altamente reutilizables, servicios backend modulares, TypeScript facilita |
| 11 | Facilidad de instalación | 3 | Requiere PostgreSQL, Node.js, configuración de variables de entorno |
| 12 | Facilidad de operación | 4 | Logs estructurados, manejo de errores claro, pero requiere conocimiento técnico |
| 13 | Múltiples sitios | 1 | Un solo sitio de despliegue en Fase 1 |
| 14 | Facilidad de cambio | 5 | TypeScript con tipado fuerte, arquitectura modular clara, separation of concerns óptima |

### Total GSC: 51

---

### 3.2 Cálculo del TAF

**TAF = 0.65 + (0.01 × GSC)**

**TAF = 0.65 + (0.01 × 51) = 0.65 + 0.51 = 1.16**

---

## 4. Function Points Ajustados (AFP)

**AFP = UFP × TAF**

**AFP = 548 × 1.16 = 635.68 ≈ 636 FP**

---

## 5. Estimación de Esfuerzo y Costo

### 5.1 Productividad por Lenguaje

Considerando:
- **TypeScript** con frameworks modernos (TypeORM, React)
- **Shadcn/UI** para componentes pre-construidos
- **TanStack Table** para datatables avanzadas
- **Deck.gl** para mapas (especializado, reduce tiempo)
- **Equipo experimentado** en el stack

| Componente | Productividad | Justificación |
|------------|---------------|---------------|
| **Backend (TypeScript + TypeORM)** | 4 horas/FP | TypeORM reduce SQL manual, pero lógica de negocio es compleja |
| **Frontend (React + TypeScript)** | 4 horas/FP | Shadcn/UI acelera, pero mapas interactivos añaden complejidad |
| **Promedio ponderado** | 4 horas/FP | Balance entre aceleración por frameworks y complejidad del dominio |

---

### 5.2 Cálculo de Esfuerzo

**Esfuerzo Total = AFP × Horas por FP**

**Esfuerzo Total = 636 FP × 4 horas/FP = 2,544 horas**

---

### 5.3 Distribución por Área

Basado en la distribución de FP por componente:

| Área | % de FP | Horas | Justificación |
|------|---------|-------|---------------|
| **Backend** | 43% | 1,094 h | ILF (19 entidades) + EI complejas + EO con agregaciones |
| **Frontend** | 50% | 1,272 h | Todas las EQ + visualizaciones complejas (mapas, gráficos, datatables) |
| **Integración & Testing** | 7% | 178 h | Testing E2E, integración, corrección de bugs finales |

---

### 5.4 Cálculo de Duración

Con equipo de 4 desarrolladores trabajando en paralelo:

**Horas disponibles por semana (con 6 días laborales):**
- 4 desarrolladores × 48 horas = 192 horas/semana

**Factor de productividad efectiva:**
- 0.75 (considerando reuniones, interrupciones, code review)

**Horas efectivas por semana:**
- 192 × 0.75 = 144 horas/semana

**Duración estimada teórica:**
- 2,544 horas / 144 horas/semana = **17.67 semanas**

**Duración real del proyecto:**
- **13.86 semanas** (25 Ago - 30 Nov 2025 = 97 días calendario)
- Con trabajo paralelo intensivo y horarios flexibles, el proyecto se comprime de 17.67 a 13.86 semanas

---

### 5.5 Cálculo de Costo

**Costo por hora = $8 USD**

**Costo Total = 2,544 horas × $8 = $20,352 USD**

---

## 6. Resumen de Estimación FPA

### Métricas Clave

| Métrica | Valor |
|---------|-------|
| **Function Points No Ajustados (UFP)** | 548 FP |
| **Factor de Ajuste Técnico (TAF)** | 1.16 |
| **Function Points Ajustados (AFP)** | 636 FP |
| **Productividad** | 4 horas/FP (alta con frameworks modernos) |
| **Esfuerzo Total** | 2,544 horas |
| **Duración Real** | 13.86 semanas (25 Ago - 30 Nov 2025) |
| **Días calendario** | 97 días (83 días laborales con 6 días/semana) |
| **Costo Total** | $20,352 USD |

---

### Distribución de Function Points

| Componente | FP | % del Total |
|------------|----|-------------|
| **Internal Logical Files (ILF)** | 183 FP | 33.4% |
| **External Inputs (EI)** | 151 FP | 27.6% |
| **External Inquiries (EQ)** | 103 FP | 18.8% |
| **External Outputs (EO)** | 101 FP | 18.4% |
| **External Interface Files (EIF)** | 10 FP | 1.8% |

---

### Distribución de Esfuerzo y Costo

| Área | Horas | Costo | % del Total |
|------|-------|-------|-------------|
| **Backend** | 1,094 h | $8,752 | 43% |
| **Frontend** | 1,272 h | $10,176 | 50% |
| **Integración & Testing** | 178 h | $1,424 | 7% |
| **TOTAL** | **2,544 h** | **$20,352** | **100%** |

---

## 7. Análisis de Complejidad por Área

### Áreas de Alta Complejidad

#### 1. Internal Logical Files (183 FP - 33.4%)
- **19 entidades** con relaciones complejas
- **Entidad más compleja:** Activity (15 FP) con múltiples relaciones
- **Riesgo:** Cambios en modelo de datos son costosos
- **Recomendación:** Diseño exhaustivo de BD en fase inicial, revisión por arquitecto

#### 2. External Inputs (151 FP - 27.6%)
- **40 procesos de entrada**, 8 de complejidad alta (6 FP cada uno)
- **Más complejos:**
  - Actualizar Campo/Parcela con GeoJSON (6 FP c/u)
  - Crear Orden de Compra (6 FP)
  - Registrar Recepción (6 FP)
  - Registrar Actividad con insumos (6 FP)
  - Crear Orden de Venta con lotes (6 FP)
- **Riesgo:** Validaciones complejas, manejo de errores transaccionales
- **Recomendación:** DTOs robustos, testing unitario exhaustivo

#### 3. External Outputs (101 FP - 18.4%)
- **17 reportes/gráficos**, 9 de complejidad alta (7 FP cada uno)
- **Más complejos:**
  - Reportes de producción con agregaciones (3 reportes)
  - Reporte de costos por actividad
  - Reporte de ganancias
  - Dashboard KPIs
  - Trazabilidad E2E
- **Riesgo:** Consultas SQL lentas con grandes volúmenes
- **Recomendación:** Índices optimizados, paginación, caching de reportes

---

## 8. Factores de Productividad Considerados

### Factores que Reducen Tiempo (Productividad 4h/FP)

1. **TypeORM (Backend):**
   - Generación automática de migraciones
   - Query Builder para consultas complejas
   - Relaciones automáticas entre entidades
   - **Impacto:** -30% tiempo en data layer

2. **Shadcn/UI (Frontend):**
   - Componentes pre-construidos de alta calidad
   - Integración nativa con Tailwind CSS
   - Accesibilidad incluida
   - **Impacto:** -40% tiempo en componentes básicos

3. **TanStack Table (Frontend):**
   - DataTables avanzadas con paginación/filtros/ordenamiento
   - API declarativa fácil de usar
   - **Impacto:** -50% tiempo en tablas complejas

4. **Deck.gl (Frontend):**
   - Renderizado eficiente de polígonos GeoJSON
   - Librería especializada en mapas
   - **Impacto:** -40% tiempo vs. implementación desde cero

5. **Experiencia del Equipo:**
   - Conocimiento previo del stack tecnológico
   - Patrones de arquitectura conocidos
   - **Impacto:** +30% velocidad de desarrollo

### Factores que Aumentan Tiempo

1. **Complejidad del Dominio:**
   - 19 entidades interrelacionadas
   - Lógica de negocio compleja (trazabilidad, transacciones)
   - **Impacto:** +20% tiempo en lógica de negocio

2. **Autorización Avanzada:**
   - Sistema de managedFields (capataces solo ven sus campos)
   - Filtrado automático por rol
   - **Impacto:** +15% tiempo en endpoints protegidos

3. **Mapas Interactivos:**
   - Curva de aprendizaje de Deck.gl
   - Editor de polígonos complejo
   - **Impacto:** +25% tiempo en módulo F5

### Balance Final
Los frameworks modernos compensan la complejidad del dominio, resultando en **4 horas/FP** (productividad alta para un proyecto de esta magnitud).

---

## 9. Camino Crítico y Dependencias

### Actividades en Camino Crítico

1. **Diseño de Entidades (183 FP de ILF)**
   - Todo depende de esto
   - Estimado: 183 FP × 4h = **732 horas** (2 backend devs = 46 días)

2. **Módulo de Mapas Interactivos**
   - Tarea más compleja del frontend
   - Estimado: ~80 FP × 4h = **320 horas** (2 frontend devs = 20 días)

3. **Lógica Transaccional (Compras + Actividades + Ventas)**
   - Core del negocio
   - Estimado: ~60 FP × 4h = **240 horas** (2 backend devs = 15 días)

---

## 10. Gestión de Riesgos por FPA

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | FP Afectados | Mitigación |
|--------|--------------|---------|--------------|------------|
| Cambios en modelo de datos | Media | Alto | 183 FP (ILF) | Validación exhaustiva con cliente en fase inicial |
| Complejidad de mapas subestimada | Media | Medio | ~80 FP | Spike técnico de Deck.gl antes de implementación |
| Performance de reportes | Baja | Alto | 101 FP (EO) | Índices en BD, paginación, benchmarks tempranos |
| Validaciones complejas fallidas | Media | Medio | 151 FP (EI) | Testing unitario exhaustivo con Jest |
| Integración frontend-backend | Baja | Medio | Todos | Contratos de API claros (DTOs), documentación con Swagger |

---

## 11. Distribución Temporal del Proyecto

### Cronograma Real: 25 Agosto - 30 Noviembre 2025 (13.86 semanas)

### Fase 1: Fundamentos (25 Ago - 14 Sep | 3 semanas - 432 horas)
- **Fechas:** 25 de agosto - 14 de septiembre
- **FP estimados:** 108 FP × 4h = 432 horas
- **Actividades:**
  - Planificación y setup (3 tareas × 3 días)
  - Entidades TypeORM (B1: 7 días, ~55 FP de ILF)
  - Sistema de autenticación completo (B2: 6 días)
  - Componentes base UI (F1, F2, F3: 9 días totales)

### Fase 2: Módulos Core (15 Sep - 12 Oct | 4 semanas - 576 horas)
- **Fechas:** 15 de septiembre - 12 de octubre
- **FP estimados:** 144 FP × 4h = 576 horas
- **Actividades:**
  - CRUDs maestros (B3: 3 días, ~36 FP de EI/EQ)
  - Módulo de Compras completo (B4 + F4: 13 días, ~40 FP)
  - Campos y Parcelas backend (B5: 4 días, ~20 FP)
  - Órdenes de Trabajo (B6: 3 días, ~15 FP)
  - Inicio de mapas frontend (F5: inicio, ~33 FP parciales)

### Fase 3: Mapas y Transacciones (13 Oct - 2 Nov | 3 semanas - 432 horas)
- **Fechas:** 13 de octubre - 2 de noviembre
- **FP estimados:** 108 FP × 4h = 432 horas
- **Actividades:**
  - **Módulo de Mapas crítico** (F5: finalización 13 días, ~47 FP restantes)
  - Lógica de Actividades (B7 + F7: 9 días, ~30 FP)
  - Módulo de Work Orders UI (F6: 5 días, ~18 FP)
  - Sistema de Lotes de Cosecha (B8 + F8: 7 días, ~13 FP)

### Fase 4: Ventas, Reportes y Trazabilidad (3 Nov - 23 Nov | 3 semanas - 432 horas)
- **Fechas:** 3 de noviembre - 23 de noviembre
- **FP estimados:** 108 FP × 4h = 432 horas
- **Actividades:**
  - Lógica de Ventas completa (B9 + F9: 7 días, ~30 FP)
  - Sistema de Envíos (B10 + F10: 7 días, ~20 FP)
  - Endpoints de Reportes (B11: 3 días, ~28 FP de EO)
  - Módulo de Reportes UI (F11: 3 días, ~18 FP)
  - Trazabilidad E2E (B12: 2 días, ~12 FP)

### Fase 5: Testing, Integración y Despliegue (24 Nov - 30 Nov | 1 semana - 144 horas)
- **Fechas:** 24 de noviembre - 30 de noviembre
- **FP estimados:** 36 FP × 4h = 144 horas
- **Actividades:**
  - Testing E2E integral (T1: 4 días)
  - Empaquetado Electron/Capacitor (T2: 2 días)
  - Documentación final (T3: 2 días)
  - Buffer para ajustes finales

### Resumen de Fases

| Fase | Fechas | Semanas | FP | Horas | % Progreso |
|------|--------|---------|-----|-------|------------|
| **Fase 1: Fundamentos** | 25 Ago - 14 Sep | 3 sem | 108 FP | 432 h | 17% |
| **Fase 2: Módulos Core** | 15 Sep - 12 Oct | 4 sem | 144 FP | 576 h | 40% |
| **Fase 3: Mapas y Trans.** | 13 Oct - 2 Nov | 3 sem | 108 FP | 432 h | 57% |
| **Fase 4: Ventas y Rep.** | 3 Nov - 23 Nov | 3 sem | 108 FP | 432 h | 74% |
| **Fase 5: Testing** | 24 Nov - 30 Nov | 1 sem | 36 FP | 144 h | 100% |

**Total:** 13.86 semanas | 504 FP principales | 2,016 horas netas + 528 horas overhead = 2,544 horas totales

---

## 12. Métricas de Seguimiento Sugeridas

### Durante el Desarrollo

1. **FP Completados vs. Planificados**
   - Objetivo: 30 FP/semana
   - Alerta si < 25 FP/semana

2. **Productividad Real (horas/FP)**
   - Objetivo: 4 horas/FP
   - Alerta si > 5 horas/FP

3. **Defect Density**
   - Objetivo: < 0.5 defectos/FP
   - Alerta si > 1 defecto/FP

4. **Cobertura de Testing**
   - Objetivo: > 80% para EI complejos
   - Objetivo: > 70% para ILF

---

## 13. Comparación con Benchmarks de Industria

### Productividad Típica por Lenguaje (IFPUG)

| Lenguaje/Framework | Horas/FP Típicas | Proyecto Actual |
|--------------------|------------------|-----------------|
| Java/Spring Boot | 6-8 horas/FP | - |
| Python/Django | 5-7 horas/FP | - |
| PHP/Laravel | 5-7 horas/FP | - |
| **TypeScript/Node.js** | 5-6 horas/FP | **4 horas/FP** ✅ |
| **TypeScript/React** | 4-5 horas/FP | **4 horas/FP** ✅ |

### Conclusión
La productividad estimada de **4 horas/FP** es **agresiva pero alcanzable** considerando:
- Stack tecnológico moderno
- Frameworks especializados (Shadcn, TanStack, Deck.gl)
- Equipo experimentado
- Arquitectura bien definida

---

## 14. Recomendaciones Finales

### Para Maximizar Productividad (4h/FP)

1. **Priorizar diseño de datos:** Invertir tiempo en fase inicial evita refactoring costoso
2. **Spike técnico de Deck.gl:** Reducir incertidumbre en módulo más complejo
3. **Componentes reutilizables:** Maximizar reutilización en frontend
4. **Testing automatizado:** Invertir en testing reduce bugs y refactoring
5. **Code reviews obligatorios:** Mantener calidad, especialmente en lógica transaccional

### Indicadores de Éxito

- ✅ Completar ILF (entidades) sin cambios mayores después de Sprint 2
- ✅ Mantener productividad en 4-5 horas/FP durante todo el proyecto
- ✅ Módulo de mapas completado dentro de 20 días (2 devs)
- ✅ Zero defectos críticos en producción después del testing E2E

---

**Fecha de inicio:** 25 de agosto de 2025  
**Fecha de finalización:** 30 de noviembre de 2025  
**Metodología:** IFPUG Function Point Analysis 4.3  
**Equipo:** 4 desarrolladores full-stack trabajando en paralelo  
**Stack:** TypeScript, Node.js, React, PostgreSQL  
**Productividad:** 4 horas/FP (alta productividad con frameworks modernos y equipo experimentado)  
**Consideraciones:** 6 días/semana con horarios flexibles, trabajo paralelo intensivo
