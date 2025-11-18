# Estimación Planning Poker Realista - Sistema ERP Tejada Hnos.

## Técnica: Planning Poker (Scrum Poker)

### Escala de Fibonacci Modificada
**Story Points:** 1, 2, 3, 5, 8, 13, 21, 34, 55, 89

### Conversión de Story Points a Horas
**Velocidad del equipo:** 1 Story Point = **8 horas** de trabajo (incluye desarrollo + overhead)

### Parámetros del Proyecto
- **Equipo:** 4 desarrolladores full-stack (trabajo paralelo y colaborativo)
- **Tarifa por hora:** $8 USD
- **Días laborales:** 6 días por semana (lunes a sábado)
- **Horario:** Flexible (promedio 8 horas diarias)
- **Duración del proyecto:** 25 agosto - 30 noviembre 2025 (97 días calendario / 83 días laborales)
- **Capacidad por sprint:** 30-35 Story Points (considerando trabajo paralelo y 6 días/semana)
- **Sprints totales estimados:** 6 sprints

---

## Sesión de Planning Poker

### Participantes
- **Desarrollador Backend Senior (DBS):** Experiencia en TypeORM, Express, PostgreSQL
- **Desarrollador Backend Mid (DBM):** Experiencia en Node.js y REST APIs
- **Desarrollador Frontend Senior (DFS):** Experiencia en React, mapas interactivos
- **Desarrollador Frontend Mid (DFM):** Experiencia en React, forms y tables

### Consideraciones para Estimación
- **Overhead incluido:** Reuniones, code reviews, documentación
- **Testing incluido:** Pruebas unitarias y de integración durante desarrollo
- **Complejidad técnica:** Stack moderno pero con curva de aprendizaje en mapas

---

## Sprint 0: Planificación y Configuración

### 1. Reuniones e ingeniería de requisitos

**Votación:**
- DBS: 5
- DBM: 5
- DFS: 5
- DFM: 5

**Consenso unánime:** **5 SP**
- **Justificación:** Múltiples reuniones con cliente, documentación de casos de uso, definición de 19 entidades con relaciones complejas.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 2. Diseño de la arquitectura del sistema

**Votación:**
- DBS: 8
- DBM: 8
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **8 SP**
- **Justificación:** Diseño completo de arquitectura monolítica en capas, diagramas ER detallados, definición de flujos de autorización complejos por managedFields, documentación técnica.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 3. Configuración de entorno de desarrollo y base de datos

**Votación:**
- DBS: 3
- DBM: 5
- DFS: 3
- DFM: 5

**Consenso después de discusión:** **5 SP**
- **Justificación:** Setup para 4 desarrolladores, PostgreSQL, repos Git separados, configuración de ESLint/Prettier, scripts de desarrollo, documentación de instalación.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

**Total Sprint 0:** **18 SP** | **144 horas** | **$1,152**

---

## Sprint 1: Fundamentos del Sistema

### 4. B1: Implementación de entidades TypeORM, DTOs y validaciones (19 entidades)

**Votación:**
- DBS: 13
- DBM: 21
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **13 SP**
- **Justificación:** 19 entidades con relaciones complejas (OneToMany, ManyToOne, ManyToMany), DTOs con class-validator, configuración de cascadas e índices. Experiencia del equipo ayuda, pero sigue siendo voluminoso.
- **Horas:** 13 × 8 = **104 horas**
- **Costo:** 104 × $8 = **$832**

### 5. B2: Sistema de autenticación JWT, roles y autorización por campos

**Votación:**
- DBS: 8
- DBM: 13
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **8 SP**
- **Justificación:** JWT con access/refresh tokens, bcrypt, middleware de autenticación y autorización por roles, sistema de managedFields. Funcionalidad crítica pero patrón conocido.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 16. F1: Sistema de diseño y componentes base con Shadcn/UI

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **5 SP**
- **Justificación:** Setup de Shadcn/UI + Tailwind, componentes base (Button, Input, Card, Modal), layout (Navbar, Sidebar), sistema de colores. Framework facilita pero requiere customización.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 17. F2: Autenticación, manejo de roles y ruteo protegido

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **5 SP**
- **Justificación:** AuthContext, páginas Login/Register, React Hook Form + Zod, ProtectedRoute, interceptores http, manejo de tokens. Patrón estándar pero requiere testing de flujos.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

**Total Sprint 1:** **31 SP** | **248 horas** | **$1,984**

---

## Sprint 2: Maestros de Datos y Compras

### 6. B3: Endpoints CRUD para entidades maestras (Variety, Customer, Supplier, Input)

**Votación:**
- DBS: 3
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **3 SP**
- **Justificación:** CRUDs estándar para 4 entidades similares, controladores + servicios + rutas, validación de DTOs. Mucha reutilización de código.
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

### 7. B4: Lógica transaccional de Compras con seguimiento de recepciones

**Votación:**
- DBS: 8
- DBM: 13
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **8 SP**
- **Justificación:** Lógica compleja: PurchaseOrder + PurchaseOrderDetail, GoodsReceipt con recepciones parciales, cálculos automáticos de cantidades, estados múltiples, transacciones de BD, actualización de precios de insumos.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 18. F3: Interfaces CRUD para maestros de datos

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 5

**Consenso unánime:** **5 SP**
- **Justificación:** DataTables con TanStack Table (paginación, búsqueda, ordenamiento), formularios con validación, modales de creación/edición, manejo de estados (loading, error, success). Componente DataTable reutilizable.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 19. F4: Módulo de Compras con gestión de órdenes y recepciones

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 13

**Consenso después de discusión:** **8 SP**
- **Justificación:** Módulo completo: listado con filtros, detalle de orden con tracking, wizard multi-paso para crear orden, módulo de recepciones con validación de cantidades, progress bars, badges de estado.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

**Total Sprint 2:** **24 SP** | **192 horas** | **$1,536**

---

## Sprint 3: Campos, Parcelas y Mapas (Sprint Largo)

### 8. B5: Endpoints CRUD para Campos y Parcelas con geometrías GeoJSON

**Votación:**
- DBS: 5
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **5 SP**
- **Justificación:** CRUDs con almacenamiento de GeoJSON, relación jerárquica Field→Plots, validación de geometrías, autorización por managedFields, endpoints de consulta con filtros.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 9. B6: Endpoints CRUD para Órdenes de Trabajo

**Votación:**
- DBS: 3
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **3 SP**
- **Justificación:** CRUD con estados, asignación a operarios, validación de autorización por campos gestionados, filtros por estado/fecha/parcela.
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

### 10. B7: Lógica transaccional de Actividades con uso de insumos

**Votación:**
- DBS: 8
- DBM: 13
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **8 SP**
- **Justificación:** Lógica compleja: Activity con InputUsage múltiple, validación de stock de insumos, actualización automática de inventario, transacciones, cálculo de costos, vinculación con WorkOrders.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 20. F5: Módulo de Campos y Parcelas con mapas interactivos GeoJSON

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 21
- DFM: 34

**Consenso después de discusión:** **21 SP**
- **Justificación:** Módulo MÁS COMPLEJO del frontend. InteractiveMap con Deck.gl (GeoJsonLayer, PolygonLayer), PlotsEditor para dibujar y editar polígonos, validación de geometrías (no auto-intersección), cálculo de áreas, tooltips, highlighting, integración con Mapbox/OSM, múltiples vistas (lista, mapa, detalle). Alta complejidad técnica con curva de aprendizaje.
- **Horas:** 21 × 8 = **168 horas**
- **Costo:** 168 × $8 = **$1,344**

**Total Sprint 3:** **37 SP** | **296 horas** | **$2,368**

---

## Sprint 4: Órdenes de Trabajo, Actividades y Lotes

### 11. B8: Sistema de Lotes de Cosecha con trazabilidad

**Votación:**
- DBS: 5
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **5 SP**
- **Justificación:** HarvestLot con agrupación de parcelas, estados múltiples, vinculación con Activities de tipo HARVEST, tracking, endpoints de consulta e inventario.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 21. F6: Módulo de Órdenes de Trabajo (Rol: Capataz)

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 8
- DFM: 8

**Consenso unánime:** **8 SP**
- **Justificación:** Dashboard con calendario/Kanban (FullCalendar), formulario de creación con autocompletado de parcelas filtradas por managedFields, asignación a operarios, filtros complejos, métricas de órdenes pendientes/vencidas, autorización estricta.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 22. F7: Módulo de Actividades (Rol: Operario)

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 8

**Consenso después de discusión:** **5 SP**
- **Justificación:** Dashboard de operario con órdenes asignadas, formulario simplificado de registro de actividades, submódulo InputUsage integrado, validación de stock, interfaz mobile-friendly, historial de actividades.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 23. F8: Módulo de Lotes de Cosecha con inventario visual

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 3
- DFM: 5

**Consenso después de discusión:** **3 SP**
- **Justificación:** Listado con cards, filtros por estado/variedad/fecha, formulario de creación con multi-select de parcelas, vista de detalle con trazabilidad (mapa de parcelas, actividades), dashboard con gráficos de inventario.
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

**Total Sprint 4:** **21 SP** | **168 horas** | **$1,344**

---

## Sprint 5: Ventas, Envíos y Reportes

### 12. B9: Lógica transaccional de Ventas con asignación de lotes

**Votación:**
- DBS: 8
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **8 SP**
- **Justificación:** SaleOrder con SaleOrderDetail, asignación automática/manual de lotes de cosecha, validación de stock disponible, estados múltiples, cálculos de totales, transacciones, actualización de estado de lotes.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

### 13. B10: Lógica transaccional de Envíos con tracking

**Votación:**
- DBS: 5
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso unánime:** **5 SP**
- **Justificación:** Shipment con ShipmentLotDetail, tracking detallado de lotes, vinculación con SaleOrder, estados múltiples, validación de cantidades, actualización automática de estados de lotes.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 24. F9: Módulo de Ventas con asignación de lotes

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 3
- DFM: 5

**Consenso después de discusión:** **3 SP**
- **Justificación:** DataTable con filtros, wizard multi-paso, asignación de lotes con validación de stock en tiempo real, cálculos automáticos, vista de detalle con información completa, acciones (confirmar/cancelar).
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

### 25. F10: Módulo de Envíos con tracking de entregas

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 3
- DFM: 3

**Consenso unánime:** **3 SP**
- **Justificación:** DataTable con filtros, formulario de creación vinculado a venta, selección de lotes, timeline visual de estados, actualización de estado con modal, dashboard de envíos en tránsito.
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

### 14. B11: Endpoints de Reportes con métricas y analytics

**Votación:**
- DBS: 5
- DBM: 8
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **5 SP**
- **Justificación:** Múltiples endpoints especializados: producción por campo/parcela/período, uso de insumos, ventas, inventario, KPIs. Agregaciones SQL complejas con QueryBuilder, filtros flexibles, optimización de consultas.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

### 26. F11: Módulo de Reportes con visualizaciones y gráficos

**Votación:**
- DBS: N/A
- DBM: N/A
- DFS: 5
- DFM: 5

**Consenso unánime:** **5 SP**
- **Justificación:** Dashboard gerencial con KPIs en cards, páginas de reportes específicos, gráficos interactivos (Chart.js/Recharts: barras, torta, líneas), filtros dinámicos por fechas/campos/clientes, exportación a PDF/CSV.
- **Horas:** 5 × 8 = **40 horas**
- **Costo:** 40 × $8 = **$320**

**Total Sprint 5:** **29 SP** | **232 horas** | **$1,856**

---

## Sprint 6: Trazabilidad y Testing Final

### 15. B12: Endpoint de trazabilidad End-to-End (E2E)

**Votación:**
- DBS: 3
- DBM: 5
- DFS: N/A
- DFM: N/A

**Consenso después de discusión:** **3 SP**
- **Justificación:** Endpoint con trazabilidad hacia atrás (lote → parcelas → actividades → insumos → compras) y hacia adelante (lote → ventas → envíos → clientes), consultas optimizadas con joins, respuesta estructurada con timeline.
- **Horas:** 3 × 8 = **24 horas**
- **Costo:** 24 × $8 = **$192**

### 29. Pruebas End-to-End integrales y preparación de entrega

**Votación:**
- DBS: 8
- DBM: 8
- DFS: 8
- DFM: 8

**Consenso unánime:** **8 SP**
- **Justificación:** Testing E2E con Playwright/Cypress para flujos completos (auth, compras, activities, ventas), pruebas exhaustivas de autorización por rol y managedFields, cross-browser testing, corrección de bugs, limpieza de código, documentación técnica y manual de usuario, build de producción, configuración de staging.
- **Horas:** 8 × 8 = **64 horas**
- **Costo:** 64 × $8 = **$512**

**Total Sprint 6:** **11 SP** | **88 horas** | **$704**

---

## Resumen de Estimación Planning Poker

### Por Sprint

| Sprint | Fechas | Enfoque | Story Points | Horas | Costo |
|--------|--------|---------|--------------|-------|-------|
| **Sprint 0** | 25 Ago - 7 Sep | Planificación y Setup | 18 SP | 144 h | $1,152 |
| **Sprint 1** | 8 Sep - 21 Sep | Fundamentos (Auth + UI Base) | 31 SP | 248 h | $1,984 |
| **Sprint 2** | 22 Sep - 5 Oct | Maestros y Compras | 24 SP | 192 h | $1,536 |
| **Sprint 3** | 6 Oct - 26 Oct | Campos, Mapas y Activities | 37 SP | 296 h | $2,368 |
| **Sprint 4** | 27 Oct - 9 Nov | Work Orders y Lotes | 21 SP | 168 h | $1,344 |
| **Sprint 5** | 10 Nov - 23 Nov | Ventas, Envíos y Reportes | 29 SP | 232 h | $1,856 |
| **Sprint 6** | 24 Nov - 30 Nov | Trazabilidad y Testing | 11 SP | 88 h | $704 |

### Total del Proyecto

| Métrica | Valor |
|---------|-------|
| **Total Story Points** | **171 SP** |
| **Duración Total** | **13.86 semanas** (25 Ago - 30 Nov 2025) |
| **Días calendario** | **97 días** (83 días laborales con 6 días/semana) |
| **Horas Totales de Desarrollo** | **1,368 horas** |
| **Costo Total del Proyecto** | **$10,944 USD** |

### Distribución por Área

| Área | Story Points | % del Total | Horas | Costo |
|------|--------------|-------------|-------|-------|
| **Planificación** | 18 SP | 10.5% | 144 h | $1,152 |
| **Backend** | 70 SP | 40.9% | 560 h | $4,480 |
| **Frontend** | 75 SP | 43.9% | 600 h | $4,800 |
| **Testing** | 8 SP | 4.7% | 64 h | $512 |

---

## Análisis de Complejidad

### Actividades de Mayor Complejidad

1. **F5: Módulo de Mapas Interactivos** - 21 SP (168 horas)
   - Mayor complejidad técnica del proyecto
   - Requiere desarrollador Senior con experiencia en mapas
   - Riesgo: Alto

2. **B1: Implementación de 19 Entidades** - 13 SP (104 horas)
   - Base fundamental para todo el proyecto
   - Riesgo: Medio-Alto

3. **B4: Lógica de Compras** - 8 SP (64 horas)
   - Transacciones complejas con múltiples estados
   - Riesgo: Medio

4. **B7: Lógica de Actividades** - 8 SP (64 horas)
   - Transacciones con actualización de inventario
   - Riesgo: Medio

5. **B9: Lógica de Ventas** - 8 SP (64 horas)
   - Asignación de lotes con validaciones
   - Riesgo: Medio

6. **F4: Módulo de Compras Frontend** - 8 SP (64 horas)
   - Wizard multi-paso con lógica compleja
   - Riesgo: Medio

7. **F6: Módulo de Órdenes de Trabajo** - 8 SP (64 horas)
   - Calendario/Kanban con autorización estricta
   - Riesgo: Medio

---

## Velocidad y Capacidad del Equipo

### Capacidad por Sprint (2 semanas)
- **4 desarrolladores** × **80 horas** = **320 horas totales**
- **Horas efectivas:** 320 × 0.75 (factor de productividad) = **240 horas**
- **Capacidad en SP:** 240 / 8 = **30 SP por sprint**

### Velocidad Planificada
- **Sprint 1:** 31 SP (ligeramente sobre capacidad, requiere atención)
- **Sprint 3:** 37 SP (sobre capacidad, sprint largo por mapas)
- **Promedio:** 28.5 SP por sprint (dentro de capacidad sostenible)

### Ajustes Considerados
- **Sprint 3** puede requerir 2.5 semanas debido a F5 (mapas)
- Considerar dividir F5 en dos sprints si se detectan problemas tempranos
- **Buffer del 10%** ya incluido en conversión (8 horas/SP incluye overhead)

---

## Gestión de Riesgos

### Riesgos Identificados

1. **Sprint 3 con 37 SP:**
   - Sobre capacidad del equipo
   - Contiene F5 (21 SP) - tarea más compleja
   - **Mitigación:** Asignar desarrollador Senior Frontend, considerar spike técnico previo de Deck.gl

2. **Dependencia crítica de B1:**
   - Todo el backend depende de las entidades
   - **Mitigación:** Completar en Sprint 1 sin retrasos, pair programming si es necesario

3. **Complejidad técnica de F5:**
   - Integración Deck.gl puede presentar desafíos
   - **Mitigación:** 
     - Spike técnico en última semana de Sprint 0
     - Documentación previa de Deck.gl
     - Prototipo simple antes de implementación completa

4. **Estimación de 1 SP = 8 horas:**
   - Incluye overhead pero puede ser subestimado en tareas nuevas
   - **Mitigación:** Refinamiento continuo, ajustar velocidad después de Sprint 1

---

## Mejoras Respecto a Estimaciones Iniciales

### Factores Considerados para Realismo

1. **Overhead Explícito:**
   - 1 SP = 8 horas (no 4 horas) incluye:
     - Reuniones diarias (30 min/día)
     - Code reviews
     - Documentación
     - Corrección de bugs menores

2. **Complejidad Real de Mapas:**
   - F5: 21 SP (no subestimado como 34 SP original demasiado alto, ni 8 SP demasiado bajo)
   - Reconoce curva de aprendizaje de Deck.gl

3. **Testing Incluido:**
   - Cada historia incluye testing unitario
   - Sprint 6 dedicado a testing E2E integral

4. **Experiencia del Equipo:**
   - Estimaciones consideran que el equipo conoce el stack
   - Senior devs en tareas críticas

---

## Recomendaciones de Ejecución

### Daily Standups
- **15 minutos diarios**
- Detectar impedimentos temprano
- Especial atención en Sprint 3 (mapas)

### Sprint Planning
- **2 horas** al inicio de cada sprint
- Refinamiento de historias pendientes
- Verificar dependencias

### Sprint Review
- **1 hora** al final de cada sprint
- Demo al cliente/stakeholders
- Recoger feedback temprano

### Sprint Retrospective
- **1 hora** al final de cada sprint
- Identificar mejoras de proceso
- Ajustar velocidad si es necesario

### Pair Programming
- Tareas de 8+ SP: considerar pair programming
- Especialmente en B1 (entidades) y F5 (mapas)

---

## Métricas de Seguimiento

### Durante el Proyecto

1. **Burndown Chart:** Seguimiento diario de SP restantes
2. **Velocity Chart:** Comparar SP completados vs. planificados por sprint
3. **Cumulative Flow:** Identificar cuellos de botella
4. **Bug Count:** Mantener bajo control durante desarrollo

### Indicadores de Alerta

- Velocity < 25 SP por sprint → Revisar impedimentos
- Sprint 3 con retraso en F5 → Considerar split
- Bug count > 20 → Dedicar tiempo a quality improvement

---

## Comparación con Otras Estimaciones

| Técnica | Duración | Horas | Costo |
|---------|----------|-------|-------|
| **Planning Poker Realista** | 13 semanas | 1,368 h | $10,944 |
| PERT Realista | 12 semanas | 2,048 h | $16,384 |
| FPA Ajustado | 19 semanas | 2,429 h | $19,432 |

### Conclusión
Planning Poker Realista es más optimista pero sostenible considerando:
- Metodología ágil con entregas incrementales
- Equipo experimentado en el stack
- Trabajo paralelo intensivo
- Frameworks modernos que aceleran desarrollo

---

**Fecha de inicio:** 25 de agosto de 2025  
**Fecha de finalización:** 30 de noviembre de 2025  
**Metodología:** Planning Poker con escala Fibonacci  
**Equipo:** 4 desarrolladores full-stack trabajando en paralelo  
**Conversión:** 1 SP = 8 horas (incluye overhead de desarrollo, reuniones, code review, testing unitario)  
**Consideraciones:** Estimación realista que balancea optimismo ágil con complejidad técnica real, 6 días/semana con horarios flexibles
