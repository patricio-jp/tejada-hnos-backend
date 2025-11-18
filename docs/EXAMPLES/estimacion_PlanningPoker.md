# Estimación Planning Poker - Sistema ERP Tejada Hnos.

## Técnica: Planning Poker (Scrum Poker)

### Escala de Fibonacci Modificada
**Story Points:** 1, 2, 3, 5, 8, 13, 21, 34, 55, 89

### Conversión de Story Points a Horas
**Velocidad del equipo:** 1 Story Point = **4 horas** de trabajo efectivo

### Parámetros del Proyecto
- **Equipo:** 4 desarrolladores (2 backend, 2 frontend)
- **Tarifa por hora:** $8 USD
- **Capacidad por sprint:** 80 Story Points (2 semanas × 4 devs × 40 horas / 4 horas por SP)
- **Sprints totales estimados:** 5-6 sprints

---

## Sesión de Planning Poker

### Participantes
- **Desarrollador Backend Senior (DBS):** Experiencia en TypeORM, Express, PostgreSQL
- **Desarrollador Backend Mid (DBM):** Experiencia en Node.js y REST APIs
- **Desarrollador Frontend Senior (DFS):** Experiencia en React, mapas interactivos
- **Desarrollador Frontend Mid (DFM):** Experiencia en React, forms y tables

---

## Sprint 0: Planificación y Configuración

### 1. Reuniones e ingeniería de requisitos

**Votación:**
- DBS: 8
- DBM: 8
- DFS: 5
- DFM: 5

**Consenso después de discusión:** **8 SP**
- **Justificación:** Requiere múltiples reuniones con cliente, documentación extensiva, y definición de casos de uso complejos.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 2. Diseño de la arquitectura del sistema

**Votación:**
- DBS: 13
- DBM: 8
- DFS: 13
- DFM: 8

**Consenso después de discusión:** **13 SP**
- **Justificación:** Diseño de 19 entidades con relaciones complejas, definición de arquitectura completa, diagramas ER, flujos de autorización avanzados.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 3. Configuración de entorno de desarrollo y base de datos

**Votación:**
- DBS: 5
- DBM: 5
- DFS: 5
- DFM: 5

**Consenso unánime:** **5 SP**
- **Justificación:** Setup de Node.js, PostgreSQL, repos Git, configuración de ESLint/Prettier, scripts de desarrollo para 4 desarrolladores.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

**Total Sprint 0:** **26 SP** | **104 horas** | **$832**

---

## Sprint 1: Fundamentos del Sistema

### 4. B1: Implementación de entidades TypeORM, DTOs y validaciones (19 entidades)

**Votación:**
- DBS: 21
- DBM: 34
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **21 SP**
- **Justificación:** 19 entidades con relaciones complejas, DTOs con validaciones, configuración de cascadas e índices. Experiencia del Senior reduce incertidumbre.
- **Horas:** 21 × 4 = **84 horas**
- **Costo:** 84 × $8 = **$672**

### 5. B2: Sistema de autenticación JWT, roles y autorización por campos

**Votación:**
- DBS: 13
- DBM: 21
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **13 SP**
- **Justificación:** JWT con access/refresh tokens, bcrypt, middleware de autorización complejo por managedFields. Funcionalidad crítica pero bien conocida.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 16. F1: Sistema de diseño y componentes base con Shadcn/UI

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 13

**Consenso después de discusión:** **8 SP**
- **Justificación:** Setup de Shadcn/UI, Tailwind, componentes base reutilizables, layout. Framework conocido facilita implementación.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 17. F2: Autenticación, manejo de roles y ruteo protegido

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 13

**Consenso después de discusión:** **8 SP**
- **Justificación:** AuthContext, login/register, ProtectedRoute, integración con JWT backend. Patrón estándar de React.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

**Total Sprint 1:** **50 SP** | **200 horas** | **$1,600**

---

## Sprint 2: Maestros de Datos y Compras

### 6. B3: Endpoints CRUD para entidades maestras (Variety, Customer, Supplier, Input)

**Votación:**
- DBS: 5
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **5 SP**
- **Justificación:** CRUDs estándar, 4 entidades similares, reutilización de código. Operaciones básicas.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

### 7. B4: Lógica transaccional de Compras con seguimiento de recepciones

**Votación:**
- DBS: 13
- DBM: 21
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **13 SP**
- **Justificación:** Lógica transaccional compleja, PurchaseOrder + GoodsReceipt, estados múltiples, cálculos automáticos, recepciones parciales.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 18. F3: Interfaces CRUD para maestros de datos

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 8

**Consenso unánime:** **8 SP**
- **Justificación:** DataTables con TanStack Table, formularios con validación, modales CRUD. Componente reutilizable reduce esfuerzo.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 19. F4: Módulo de Compras con gestión de órdenes y recepciones

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 13
- DFM: 21

**Consenso después de discusión:** **13 SP**
- **Justificación:** Módulo complejo con wizard multi-paso, tracking de recepciones, progress bars, múltiples vistas interconectadas.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

**Total Sprint 2:** **39 SP** | **156 horas** | **$1,248**

---

## Sprint 3: Campos, Parcelas y Órdenes de Trabajo

### 8. B5: Endpoints CRUD para Campos y Parcelas con geometrías GeoJSON

**Votación:**
- DBS: 8
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **8 SP**
- **Justificación:** CRUDs con GeoJSON, relaciones jerárquicas Field→Plots, validación de geometrías, autorización por managedFields.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 9. B6: Endpoints CRUD para Órdenes de Trabajo

**Votación:**
- DBS: 5
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **5 SP**
- **Justificación:** CRUD estándar con estados, asignación a operarios, validación de autorización por campos gestionados.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

### 10. B7: Lógica transaccional de Actividades con uso de insumos

**Votación:**
- DBS: 13
- DBM: 21
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **13 SP**
- **Justificación:** Lógica compleja con InputUsage múltiple, validación de stock, actualización de inventario, transacciones, costos automáticos.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 20. F5: Módulo de Campos y Parcelas con mapas interactivos GeoJSON

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 34
- DFM: 55

**Consenso después de discusión:** **34 SP**
- **Justificación:** Módulo más complejo del frontend. Integración Deck.gl, InteractiveMap, PlotsEditor con edición de polígonos, validación de geometrías, múltiples capas, tooltips. Alta complejidad técnica.
- **Horas:** 34 × 4 = **136 horas**
- **Costo:** 136 × $8 = **$1,088**

**Total Sprint 3:** **60 SP** | **240 horas** | **$1,920**

---

## Sprint 4: Órdenes de Trabajo, Actividades y Lotes

### 11. B8: Sistema de Lotes de Cosecha con trazabilidad

**Votación:**
- DBS: 8
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **8 SP**
- **Justificación:** HarvestLot con agrupación de parcelas, estados, vinculación con Activities de tipo HARVEST, tracking.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 21. F6: Módulo de Órdenes de Trabajo (Rol: Capataz)

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 13
- DFM: 13

**Consenso unánime:** **13 SP**
- **Justificación:** Dashboard con calendario/Kanban, formulario con autocompletado de parcelas filtradas, asignación a operarios, filtros complejos, autorización estricta.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 22. F7: Módulo de Actividades (Rol: Operario)

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 13

**Consenso después de discusión:** **8 SP**
- **Justificación:** Dashboard de operario, formulario simplificado de actividades, InputUsage integrado, validación de stock, interfaz mobile-friendly.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 23. F8: Módulo de Lotes de Cosecha con inventario visual

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **5 SP**
- **Justificación:** Listado con cards, formulario con multi-select de parcelas, vista de detalle con trazabilidad, dashboard con gráficos.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

**Total Sprint 4:** **34 SP** | **136 horas** | **$1,088**

---

## Sprint 5: Ventas, Envíos y Reportes

### 12. B9: Lógica transaccional de Ventas con asignación de lotes

**Votación:**
- DBS: 13
- DBM: 13
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **13 SP**
- **Justificación:** SaleOrder con asignación de lotes, validación de stock, estados múltiples, cálculos automáticos, transacciones.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

### 13. B10: Lógica transaccional de Envíos con tracking

**Votación:**
- DBS: 8
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **8 SP**
- **Justificación:** Shipment con ShipmentLotDetail, tracking de lotes, vinculación con SaleOrder, estados, validaciones.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 24. F9: Módulo de Ventas con asignación de lotes

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **5 SP**
- **Justificación:** DataTable con filtros, wizard multi-paso, asignación automática de lotes, validación de stock en tiempo real.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

### 25. F10: Módulo de Envíos con tracking de entregas

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 5

**Consenso unánime:** **5 SP**
- **Justificación:** DataTable con filtros, formulario de creación vinculado a venta, timeline visual de estados, actualización de estado.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

### 14. B11: Endpoints de Reportes con métricas y analytics

**Votación:**
- DBS: 8
- DBM: 13
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **8 SP**
- **Justificación:** Múltiples endpoints de reportes, agregaciones SQL complejas con QueryBuilder, KPIs, filtros flexibles, optimización de consultas.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

### 26. F11: Módulo de Reportes con visualizaciones y gráficos

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 8

**Consenso unánime:** **8 SP**
- **Justificación:** Dashboard con KPIs, gráficos interactivos con Chart.js/Recharts, páginas de reportes específicos, filtros dinámicos, exportación PDF/CSV.
- **Horas:** 8 × 4 = **32 horas**
- **Costo:** 32 × $8 = **$256**

**Total Sprint 5:** **47 SP** | **188 horas** | **$1,504**

---

## Sprint 6: Trazabilidad y Testing

### 15. B12: Endpoint de trazabilidad End-to-End (E2E)

**Votación:**
- DBS: 5
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **5 SP**
- **Justificación:** Endpoint con trazabilidad hacia atrás y adelante, consultas con joins optimizados, respuesta estructurada con timeline.
- **Horas:** 5 × 4 = **20 horas**
- **Costo:** 20 × $8 = **$160**

### 29. Pruebas End-to-End integrales y preparación de entrega

**Votación:**
- DBS: 13
- DBM: 13
- DFS: 13
- DFM: 13

**Consenso unánime:** **13 SP**
- **Justificación:** Testing E2E con Playwright/Cypress, pruebas de autorización exhaustivas, cross-browser testing, corrección de bugs, documentación, build de producción.
- **Horas:** 13 × 4 = **52 horas**
- **Costo:** 52 × $8 = **$416**

**Total Sprint 6:** **18 SP** | **72 horas** | **$576**

---

## Resumen de Estimación Planning Poker

### Por Sprint

| Sprint | Enfoque | Story Points | Horas | Costo | Duración |
|--------|---------|--------------|-------|-------|----------|
| **Sprint 0** | Planificación y Setup | 26 SP | 104 h | $832 | 2 semanas |
| **Sprint 1** | Fundamentos (Auth + UI Base) | 50 SP | 200 h | $1,600 | 2 semanas |
| **Sprint 2** | Maestros y Compras | 39 SP | 156 h | $1,248 | 2 semanas |
| **Sprint 3** | Campos, Mapas y Activities | 60 SP | 240 h | $1,920 | 2 semanas |
| **Sprint 4** | Work Orders y Lotes | 34 SP | 136 h | $1,088 | 2 semanas |
| **Sprint 5** | Ventas, Envíos y Reportes | 47 SP | 188 h | $1,504 | 2 semanas |
| **Sprint 6** | Trazabilidad y Testing | 18 SP | 72 h | $576 | 1 semana |

### Total del Proyecto

| Métrica | Valor |
|---------|-------|
| **Total Story Points** | **274 SP** |
| **Duración Total** | **13 semanas** (≈ 3.25 meses) |
| **Horas Totales de Desarrollo** | **1,096 horas** |
| **Costo Total del Proyecto** | **$8,768 USD** |

### Distribución por Área

| Área | Story Points | % del Total | Horas | Costo |
|------|--------------|-------------|-------|-------|
| **Planificación** | 26 SP | 9.5% | 104 h | $832 |
| **Backend** | 113 SP | 41.2% | 452 h | $3,616 |
| **Frontend** | 122 SP | 44.5% | 488 h | $3,904 |
| **Testing** | 13 SP | 4.7% | 52 h | $416 |

---

## Análisis de Complejidad

### Actividades de Mayor Complejidad (≥13 SP)

1. **F5: Módulo de Mapas Interactivos** - 34 SP
   - Mayor complejidad técnica del proyecto
   - Integración Deck.gl + edición de polígonos
   - Riesgo: Alto

2. **B1: Implementación de 19 Entidades** - 21 SP
   - Fundamental para el resto del proyecto
   - Relaciones complejas entre entidades
   - Riesgo: Medio-Alto

3. **B2: Sistema de Autenticación y Autorización** - 13 SP
   - Funcionalidad crítica de seguridad
   - Autorización por campos gestionados compleja
   - Riesgo: Medio

4. **B4: Lógica de Compras** - 13 SP
   - Transacciones complejas con múltiples estados
   - Riesgo: Medio

5. **B7: Lógica de Actividades** - 13 SP
   - Transacciones con actualización de inventario
   - Riesgo: Medio

6. **B9: Lógica de Ventas** - 13 SP
   - Asignación de lotes con validaciones
   - Riesgo: Medio

7. **F4: Módulo de Compras Frontend** - 13 SP
   - Wizard multi-paso con lógica compleja
   - Riesgo: Medio

8. **F6: Módulo de Órdenes de Trabajo** - 13 SP
   - Calendario/Kanban con autorización estricta
   - Riesgo: Medio

9. **Testing E2E Final** - 13 SP
   - Crítico para asegurar calidad
   - Riesgo: Bajo

---

## Velocidad y Capacidad del Equipo

### Capacidad por Sprint (2 semanas)
- **4 desarrolladores** × **80 horas** = **320 horas totales**
- **Horas efectivas:** 320 × 0.75 (factor de productividad) = **240 horas**
- **Capacidad en SP:** 240 / 4 = **60 SP por sprint**

### Velocidad Observada
- **Sprint 1:** 50 SP (dentro de capacidad)
- **Sprint 3:** 60 SP (capacidad máxima, atención a riesgos)
- **Promedio:** 45.67 SP por sprint

---

## Gestión de Riesgos

### Riesgos Identificados en Planning Poker

1. **Sprint 3 con 60 SP:**
   - Riesgo de burnout
   - Contiene F5 (34 SP) - tarea más compleja
   - **Mitigación:** Asignar desarrollador Senior con experiencia en mapas

2. **Dependencia crítica de B1:**
   - Todo el backend depende de las entidades
   - **Mitigación:** Completar en Sprint 1 sin retrasos

3. **Complejidad técnica de F5:**
   - Integración Deck.gl puede presentar desafíos
   - **Mitigación:** Spike técnico previo, considerar dividir en 2 sprints si es necesario

---

## Comparación con Desarrollo Real

### Estado Actual del Proyecto (15 Nov 2025)
- **Sprints completados:** 4.5 sprints
- **Story Points entregados:** ~200 SP
- **Velocidad real:** 44.4 SP por sprint
- **Desviación:** -2.8% (muy cercano a lo estimado)

### Actividades Pendientes
- B9: Ventas (13 SP)
- B10: Envíos (8 SP)
- B11-B12: Reportes y Trazabilidad (13 SP)
- F8-F11: Módulos finales de frontend (26 SP)
- Testing final (13 SP)
- **Total restante:** ~73 SP

### Proyección de Finalización
- **73 SP restantes** / **45 SP por sprint** = **1.6 sprints**
- **Fecha estimada:** 30 Nov 2025 ✅ (alineado con deadline)

---

## Recomendaciones Planning Poker

1. **Mantener sprints de 2 semanas** para ritmo sostenible
2. **Daily standups** para detectar impedimentos temprano
3. **Retrospectivas** al final de cada sprint para mejorar velocidad
4. **Refinamiento del backlog** continuo para ajustar estimaciones
5. **Pair programming** en tareas de 13+ SP para reducir riesgo
6. **Buffer del 10%** en estimaciones (ya incluido en conversión SP a horas)

---

**Fecha de estimación:** 15 de noviembre de 2025  
**Metodología:** Planning Poker con escala Fibonacci  
**Equipo:** 4 desarrolladores (2 backend + 2 frontend)  
**Conversión:** 1 SP = 4 horas efectivas
