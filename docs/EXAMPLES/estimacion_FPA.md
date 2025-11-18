# Estimación FPA (Function Point Analysis) - Sistema ERP Tejada Hnos.

## Técnica: Function Point Analysis (Análisis de Puntos de Función)

### Metodología IFPUG (International Function Point Users Group)

---

## Parámetros del Proyecto
- **Equipo:** 4 desarrolladores (2 backend, 2 frontend)
- **Tarifa por hora:** $8 USD
- **Productividad:** 10 horas por Function Point (FP)
- **Lenguaje:** TypeScript (Backend + Frontend)

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
| 16 | Trazabilidad E2E hacia adelante (desde envío) | Compleja | 7 |
| 17 | Exportación de Reportes a PDF | Media | 5 |
| 18 | Exportación de Reportes a CSV | Simple | 4 |

**Subtotal EO:** **108 FP**

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
| **External Outputs (EO)** | 18 funciones | **108 FP** |
| **External Inquiries (EQ)** | 30 funciones | **103 FP** |
| **Internal Logical Files (ILF)** | 19 entidades | **183 FP** |
| **External Interface Files (EIF)** | 2 interfaces | **10 FP** |

### **UFP Total: 555 FP**

---

## 3. Factor de Ajuste Técnico (TAF)

### 3.1 Características Generales del Sistema (GSC)

| # | Característica | Grado de Influencia (0-5) | Justificación |
|---|----------------|---------------------------|---------------|
| 1 | Comunicación de datos | 4 | API REST con JSON, WebSockets potencial |
| 2 | Procesamiento distribuido | 1 | Arquitectura monolítica, no distribuida |
| 3 | Rendimiento | 3 | Consultas optimizadas, índices, paginación |
| 4 | Configuración de uso intensivo | 2 | Base de datos PostgreSQL compartida |
| 5 | Tasa de transacciones | 3 | Transacciones moderadas (compras, ventas, actividades) |
| 6 | Entrada de datos en línea | 5 | 100% de entrada de datos online (web/mobile) |
| 7 | Eficiencia del usuario final | 4 | UI intuitiva, componentes reutilizables, mobile-friendly |
| 8 | Actualización en línea | 4 | CRUD en tiempo real, actualizaciones inmediatas |
| 9 | Complejidad del procesamiento | 4 | Lógica transaccional compleja, cálculos automáticos, trazabilidad |
| 10 | Reusabilidad | 4 | Componentes frontend reutilizables, servicios backend modulares |
| 11 | Facilidad de instalación | 3 | Docker potencial, pero requiere configuración de PostgreSQL |
| 12 | Facilidad de operación | 3 | Logs, manejo de errores, backups manuales |
| 13 | Múltiples sitios | 2 | Un solo sitio de despliegue inicialmente |
| 14 | Facilidad de cambio | 4 | TypeScript, arquitectura modular, separation of concerns |

### Total GSC: 46

---

### 3.2 Cálculo del TAF

**TAF = 0.65 + (0.01 × GSC)**

**TAF = 0.65 + (0.01 × 46) = 0.65 + 0.46 = 1.11**

---

## 4. Function Points Ajustados (AFP)

**AFP = UFP × TAF**

**AFP = 555 × 1.11 = 616.05 ≈ 616 FP**

---

## 5. Estimación de Esfuerzo y Costo

### 5.1 Productividad por Lenguaje

Según benchmarks de IFPUG y experiencia de industria:

| Lenguaje/Framework | Horas por FP | Justificación |
|--------------------|--------------|---------------|
| **TypeScript (Node.js Backend)** | 10 horas/FP | TypeORM reduce complejidad de SQL, pero lógica de negocio es compleja |
| **TypeScript (React Frontend)** | 9 horas/FP | React moderno con hooks, librerías UI (Shadcn), pero mapas añaden complejidad |
| **Promedio del proyecto** | 10 horas/FP | Considerando complejidad de mapas interactivos y lógica transaccional |

---

### 5.2 Cálculo de Esfuerzo

**Esfuerzo Total = AFP × Horas por FP**

**Esfuerzo Total = 616 FP × 10 horas/FP = 6,160 horas**

---

### 5.3 Distribución por Área

Basado en la distribución de FP por componente:

| Área | % de FP | Horas | Justificación |
|------|---------|-------|---------------|
| **Backend** | 45% | 2,772 h | ILF (19 entidades) + EI complejas + EO con lógica |
| **Frontend** | 48% | 2,957 h | Todas las EQ + visualizaciones complejas (mapas, gráficos) |
| **Testing e Integración** | 7% | 431 h | Validación E2E, pruebas de integración |

---

### 5.4 Cálculo de Duración

Con equipo de 4 desarrolladores trabajando 8 horas/día, 5 días/semana:

**Horas disponibles por semana = 4 devs × 40 horas = 160 horas/semana**

**Factor de productividad efectiva = 0.75** (considerando reuniones, interrupciones, code review)

**Horas efectivas por semana = 160 × 0.75 = 120 horas/semana**

**Duración = 6,160 horas / 120 horas/semana = 51.33 semanas ≈ 52 semanas (1 año)**

---

### 5.5 Cálculo de Costo

**Costo por hora = $8 USD**

**Costo Total = 6,160 horas × $8 = $49,280 USD**

---

## 6. Resumen de Estimación FPA

### Métricas Clave

| Métrica | Valor |
|---------|-------|
| **Function Points No Ajustados (UFP)** | 555 FP |
| **Factor de Ajuste Técnico (TAF)** | 1.11 |
| **Function Points Ajustados (AFP)** | 616 FP |
| **Productividad** | 10 horas/FP |
| **Esfuerzo Total** | 6,160 horas |
| **Duración Estimada** | 52 semanas (1 año) |
| **Costo Total** | $49,280 USD |

---

### Distribución de Function Points

| Componente | FP | % del Total |
|------------|----|-------------|
| **Internal Logical Files (ILF)** | 183 FP | 33.0% |
| **External Inputs (EI)** | 151 FP | 27.2% |
| **External Outputs (EO)** | 108 FP | 19.5% |
| **External Inquiries (EQ)** | 103 FP | 18.6% |
| **External Interface Files (EIF)** | 10 FP | 1.8% |

---

### Distribución de Esfuerzo y Costo

| Área | Horas | Costo | % del Total |
|------|-------|-------|-------------|
| **Backend** | 2,772 h | $22,176 | 45% |
| **Frontend** | 2,957 h | $23,656 | 48% |
| **Testing e Integración** | 431 h | $3,448 | 7% |
| **TOTAL** | **6,160 h** | **$49,280** | **100%** |

---

## 7. Comparación con Desarrollo Real

### Estado Actual del Proyecto (15 Nov 2025)

Según el plan de actividades, el proyecto ha sido desarrollado en **~3 meses** (25 Ago - 30 Nov 2025) con entrega prevista para el 30 de noviembre.

### Análisis de Desviación

| Aspecto | Estimación FPA | Desarrollo Real | Desviación |
|---------|----------------|-----------------|------------|
| **Duración** | 52 semanas (1 año) | 13 semanas (3 meses) | **-75%** |
| **Horas Totales** | 6,160 horas | ~1,664 horas* | **-73%** |
| **Costo** | $49,280 | ~$13,312* | **-73%** |

*Cálculo estimado: 13 semanas × 4 devs × 32 horas efectivas/semana

---

### Factores que Explican la Desviación

#### 1. **Alcance Reducido en Fase 1**
- **F12 (Trazabilidad E2E UI):** Movido a Fase 2
- **F13 (Empaquetado Electron/Capacitor):** Movido a Fase 2
- **Reducción de FP:** ~50 FP menos en Fase 1
- **Ajuste:** 616 FP → **~566 FP en Fase 1**

#### 2. **Mayor Productividad con Frameworks Modernos**
- **TypeORM:** Generación automática de migraciones, reduce tiempo de desarrollo de entidades
- **Shadcn/UI:** Componentes pre-construidos, reduce tiempo de desarrollo de UI
- **TanStack Table:** DataTables complejas con menos código
- **Deck.gl:** Mapas avanzados con librerías especializadas
- **Productividad real:** ~6-7 horas/FP en lugar de 10 horas/FP
- **Ajuste:** 566 FP × 7 horas/FP = **3,962 horas**

#### 3. **Trabajo Paralelo Intensivo**
- 4 desarrolladores trabajando en paralelo desde el inicio
- Backend y frontend desarrollados simultáneamente
- Reducción de tiempo calendario (no de esfuerzo)
- **Duración con paralelización:** 3,962 horas / (4 devs × 32h efectivas/semana) = **31 semanas**

#### 4. **Desarrollo Ágil con Entregas Incrementales**
- MVP funcional en primeros sprints
- Testing continuo en lugar de fase final grande
- Menor overhead de documentación formal
- **Reducción adicional:** ~20% de overhead eliminado

#### 5. **Experiencia del Equipo**
- Equipo con experiencia previa en stack tecnológico
- Patrones de arquitectura conocidos (MVC, Repository pattern)
- Reutilización de código de proyectos anteriores potencial
- **Factor de experiencia:** 1.3x productividad

---

### Estimación FPA Ajustada para el Contexto Real

| Factor de Ajuste | Multiplicador | Impacto |
|------------------|---------------|---------|
| **Alcance reducido (Fase 1)** | 0.92 | 566 FP en lugar de 616 FP |
| **Frameworks modernos** | 0.70 | 7 h/FP en lugar de 10 h/FP |
| **Desarrollo paralelo** | 0.60 | Reduce tiempo calendario |
| **Metodología ágil** | 0.80 | Reduce overhead |
| **Experiencia del equipo** | 0.77 | Aumenta productividad |

#### Esfuerzo Ajustado
**566 FP × 7 h/FP × 0.80 (ágil) × 0.77 (experiencia) = 2,429 horas**

#### Duración Ajustada
**2,429 horas / (4 devs × 32h efectivas/semana) = 19 semanas ≈ 4-5 meses**

#### Costo Ajustado
**2,429 horas × $8 = $19,432 USD**

---

### Estimación FPA Realista Final

| Métrica | FPA Estándar | FPA Ajustado al Contexto |
|---------|--------------|--------------------------|
| **Function Points** | 616 FP | 566 FP (Fase 1) |
| **Productividad** | 10 h/FP | 7 h/FP (frameworks modernos) |
| **Esfuerzo Total** | 6,160 h | 2,429 h (con ajustes de metodología) |
| **Duración** | 52 semanas | 19 semanas (4-5 meses) |
| **Costo** | $49,280 | $19,432 |

---

## 8. Riesgos Identificados por FPA

### Áreas de Alta Complejidad (Alto FP)

1. **Internal Logical Files (183 FP - 33%)**
   - 19 entidades con relaciones complejas
   - **Riesgo:** Cambios en modelo de datos son costosos
   - **Mitigación:** Diseño de BD exhaustivo en fase inicial

2. **External Inputs Complejos (151 FP - 27%)**
   - Múltiples procesos de entrada transaccionales
   - **Riesgo:** Validaciones complejas, manejo de errores
   - **Mitigación:** DTOs con class-validator, testing unitario

3. **External Outputs (108 FP - 19%)**
   - Reportes con agregaciones complejas
   - **Riesgo:** Consultas lentas con grandes volúmenes
   - **Mitigación:** Índices en BD, paginación, caching

---

## 9. Recomendaciones FPA

1. **Priorizar ILF (Entidades):** Fundamental completar diseño de datos antes de avanzar
2. **Automatización:** Usar generadores de código donde sea posible (TypeORM migrations, Shadcn components)
3. **Testing temprano:** Con 40 EI, validar inputs desde el inicio
4. **Optimización de consultas:** 18 EO requieren atención a performance de reportes
5. **Documentación de interfaces:** 30 EQ requieren documentación clara de APIs

---

## 10. Conclusiones FPA

### Ventajas del Análisis de Puntos de Función

1. ✅ **Independiente de la tecnología:** FP se calcula antes de elegir stack
2. ✅ **Basado en funcionalidad:** Mide lo que el usuario ve, no líneas de código
3. ✅ **Benchmark de industria:** Permite comparar con proyectos similares
4. ✅ **Identifica complejidad:** Revela áreas de alto riesgo (19 entidades, 40 inputs)

### Limitaciones en Este Proyecto

1. ⚠️ **Sobrestimación inicial:** FPA estándar no considera frameworks modernos
2. ⚠️ **No captura paralelización:** FP mide esfuerzo, no duración calendario
3. ⚠️ **Factor de experiencia:** No ajusta por experiencia del equipo en el stack
4. ⚠️ **Metodología ágil:** FPA asume modelo waterfall, no scrum

### Estimación Final Recomendada

Para proyectos similares con:
- Stack moderno (TypeScript + React + TypeORM)
- Equipo experimentado (4 devs)
- Metodología ágil
- Frameworks UI (Shadcn, TanStack)
- Librerías especializadas (Deck.gl)

**Usar factor de ajuste global de 0.40x sobre FPA estándar:**

| Métrica | Valor |
|---------|-------|
| **Function Points Ajustados** | 566 FP (Fase 1) |
| **Productividad Efectiva** | 4-5 horas/FP |
| **Esfuerzo Total** | 2,300-2,800 horas |
| **Duración** | 18-22 semanas (4-5 meses) |
| **Costo** | $18,400-$22,400 |

**Esta estimación se alinea con el desarrollo real del proyecto.**

---

**Fecha de estimación:** 15 de noviembre de 2025  
**Metodología:** IFPUG Function Point Analysis 4.3  
**Equipo:** 4 desarrolladores (2 backend + 2 frontend)  
**Stack:** TypeScript, Node.js, React, PostgreSQL
