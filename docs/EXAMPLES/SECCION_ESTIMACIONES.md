# Estimaciones del Proyecto

## Introducción

Para el desarrollo del Sistema ERP Tejada Hnos., se aplicaron tres técnicas de estimación reconocidas en la industria del software con el objetivo de obtener una visión completa del esfuerzo, duración y costo del proyecto. Cada técnica aporta una perspectiva diferente que, en conjunto, permite una planificación más precisa y realista.

### Contexto del Proyecto

- **Período de ejecución:** 25 de agosto - 30 de noviembre de 2025
- **Duración:** 97 días calendario (83 días laborales)
- **Equipo:** 4 desarrolladores full-stack trabajando en paralelo
- **Modalidad de trabajo:** 6 días por semana (lunes a sábado) con horarios flexibles
- **Tarifa:** $8 USD por hora
- **Stack tecnológico:** TypeScript, Node.js, Express, TypeORM, PostgreSQL, React, Vite, Shadcn/UI, Deck.gl

---

## Estimación PERT

### Descripción de la Técnica

PERT (Program Evaluation and Review Technique) es una técnica de estimación probabilística que considera tres escenarios para cada tarea: optimista, más probable y pesimista. Utiliza la fórmula:

**Tiempo Esperado (TE) = (Optimista + 4×Más Probable + Pesimista) / 6**

Esta técnica es especialmente útil cuando existe incertidumbre en las estimaciones, ya que permite calcular la desviación estándar y establecer rangos de confianza para las tareas más críticas.

### Resultados de la Estimación PERT

#### Métricas Principales

| Métrica | Valor |
|---------|-------|
| **Duración Total** | 97 días calendario / 83 días laborales |
| **Horas Totales** | 2,048 horas |
| **Costo Total** | $16,384 USD |

#### Distribución por Fase

| Fase | Días | Horas | Costo | % del Total |
|------|------|-------|-------|-------------|
| Planificación y Configuración | 9 días | 288 h | $2,304 | 14.1% |
| Backend | 50 días | 800 h | $6,400 | 39.1% |
| Frontend | 54 días | 864 h | $6,912 | 42.2% |
| Testing Final | 3 días | 96 h | $768 | 4.7% |

#### Análisis de Actividades Críticas

La estimación PERT identificó las siguientes actividades en el camino crítico del proyecto:

1. **B1 - Implementación de Entidades TypeORM (7 días)**
   - Optimista: 5 días | Más Probable: 7 días | Pesimista: 10 días
   - Desviación estándar: 0.83 días
   - Rango de confianza 95%: 5.37 a 8.63 días
   - **Criticidad:** Alta - Base fundamental del proyecto

2. **F5 - Módulo de Campos y Parcelas con Mapas (13 días)**
   - Optimista: 10 días | Más Probable: 13 días | Pesimista: 18 días
   - Desviación estándar: 1.33 días
   - Rango de confianza 95%: 10.39 a 15.61 días
   - **Criticidad:** Alta - Mayor riesgo técnico del proyecto

3. **F4 - Módulo de Compras (7 días)**
   - Optimista: 5 días | Más Probable: 7 días | Pesimista: 10 días
   - Desviación estándar: 0.83 días
   - Rango de confianza 95%: 5.37 a 8.63 días
   - **Criticidad:** Media - Módulo transaccional complejo

#### Cronograma de Sprints

La estimación PERT definió el siguiente cronograma de trabajo:

- **Sprint 0 (25 Ago - 31 Ago):** Planificación y fundamentos
- **Sprint 1 (1 Sep - 14 Sep):** Entidades, autenticación y maestros
- **Sprint 2 (15 Sep - 28 Sep):** Autenticación backend y compras
- **Sprint 3 (29 Sep - 14 Oct):** Campos, parcelas y órdenes de trabajo
- **Sprint 4 (15 Oct - 28 Oct):** Actividades, lotes y ventas
- **Sprint 5 (29 Oct - 14 Nov):** Envíos, reportes y trazabilidad
- **Sprint 6 (15 Nov - 30 Nov):** Testing final y entrega

#### Recomendaciones PERT

1. Priorizar la tarea B1 (Entidades) sin retrasos, ya que todo el backend depende de ella
2. Asignar desarrollador Senior a F5 (Mapas) por su alta complejidad
3. Considerar un buffer adicional de 10 días para imprevistos
4. Implementar daily standups para detectar bloqueos en el camino crítico
5. Realizar pruebas incrementales en lugar de esperar al final

---

## Planning Poker

### Descripción de la Técnica

Planning Poker es una técnica ágil de estimación colaborativa que utiliza la escala de Fibonacci modificada (1, 2, 3, 5, 8, 13, 21, 34, 55, 89) para asignar Story Points a cada tarea. Los Story Points representan el esfuerzo relativo considerando complejidad, incertidumbre y esfuerzo.

Para este proyecto, se estableció que **1 Story Point = 8 horas** de trabajo, incluyendo:
- Desarrollo de código
- Reuniones diarias y de equipo
- Code reviews
- Testing unitario
- Documentación técnica

### Resultados de la Estimación Planning Poker

#### Métricas Principales

| Métrica | Valor |
|---------|-------|
| **Total Story Points** | 171 SP |
| **Duración Total** | 13.86 semanas (97 días calendario) |
| **Horas Totales** | 1,368 horas |
| **Costo Total** | $10,944 USD |

#### Distribución por Sprint

| Sprint | Fechas | Enfoque | Story Points | Horas | Costo |
|--------|--------|---------|--------------|-------|-------|
| **Sprint 0** | 25 Ago - 7 Sep | Planificación y Setup | 18 SP | 144 h | $1,152 |
| **Sprint 1** | 8 Sep - 21 Sep | Fundamentos (Auth + UI Base) | 31 SP | 248 h | $1,984 |
| **Sprint 2** | 22 Sep - 5 Oct | Maestros y Compras | 24 SP | 192 h | $1,536 |
| **Sprint 3** | 6 Oct - 26 Oct | Campos, Mapas y Activities | 37 SP | 296 h | $2,368 |
| **Sprint 4** | 27 Oct - 9 Nov | Work Orders y Lotes | 21 SP | 168 h | $1,344 |
| **Sprint 5** | 10 Nov - 23 Nov | Ventas, Envíos y Reportes | 29 SP | 232 h | $1,856 |
| **Sprint 6** | 24 Nov - 30 Nov | Trazabilidad y Testing | 11 SP | 88 h | $704 |

#### Distribución por Área

| Área | Story Points | % del Total | Horas | Costo |
|------|--------------|-------------|-------|-------|
| **Planificación** | 18 SP | 10.5% | 144 h | $1,152 |
| **Backend** | 70 SP | 40.9% | 560 h | $4,480 |
| **Frontend** | 75 SP | 43.9% | 600 h | $4,800 |
| **Testing** | 8 SP | 4.7% | 64 h | $512 |

#### Actividades de Mayor Complejidad

1. **F5: Módulo de Mapas Interactivos - 21 SP (168 horas)**
   - Mayor complejidad técnica del proyecto
   - Requiere experiencia en Deck.gl
   - Riesgo: Alto

2. **B1: Implementación de 19 Entidades - 13 SP (104 horas)**
   - Base fundamental para todo el proyecto
   - Relaciones complejas entre entidades
   - Riesgo: Medio-Alto

3. **B4: Lógica de Compras - 8 SP (64 horas)**
   - Transacciones complejas con múltiples estados
   - Cálculo de Costo Promedio Ponderado
   - Riesgo: Medio

4. **B7: Lógica de Actividades - 8 SP (64 horas)**
   - Transacciones con actualización de inventario
   - Validaciones de stock en tiempo real
   - Riesgo: Medio

5. **B9: Lógica de Ventas - 8 SP (64 horas)**
   - Asignación de lotes con validaciones
   - Manejo de estados complejos
   - Riesgo: Medio

#### Velocidad del Equipo

**Capacidad por Sprint (2 semanas):**
- 4 desarrolladores × 80 horas = 320 horas totales
- Horas efectivas: 320 × 0.75 = 240 horas
- Capacidad en SP: 240 / 8 = **30 SP por sprint**

**Velocidad Observada:**
- Sprint 1: 31 SP (ligeramente sobre capacidad)
- Sprint 3: 37 SP (requiere atención especial por F5)
- Promedio: 28.5 SP por sprint (sostenible)

#### Gestión de Riesgos Planning Poker

1. **Sprint 3 con 37 SP:** Sobre la capacidad del equipo. Contiene F5 (21 SP), la tarea más compleja.
   - **Mitigación:** Asignar desarrollador Senior Frontend, considerar spike técnico previo de Deck.gl

2. **Dependencia crítica de B1:** Todo el backend depende de las entidades.
   - **Mitigación:** Completar en Sprint 1 sin retrasos, pair programming si es necesario

3. **Estimación de overhead:** 1 SP = 8 horas incluye overhead pero puede ser subestimado.
   - **Mitigación:** Refinamiento continuo, ajustar velocidad después de Sprint 1

---

## Análisis de Puntos de Función (FPA)

### Descripción de la Técnica

Function Point Analysis (FPA) según la metodología IFPUG (International Function Point Users Group) es una técnica de medición de software que cuantifica la funcionalidad entregada al usuario. Los componentes funcionales se clasifican en:

- **External Inputs (EI):** Entradas externas que procesan datos
- **External Outputs (EO):** Salidas con lógica de cálculo
- **External Inquiries (EQ):** Consultas de recuperación de datos
- **Internal Logical Files (ILF):** Archivos lógicos internos
- **External Interface Files (EIF):** Archivos de interfaz externa

Cada componente recibe un peso según su complejidad (Simple, Media, Compleja) y se ajusta mediante un Factor de Ajuste Técnico (TAF) que considera las características del sistema.

### Resultados de la Estimación FPA

#### Métricas Principales

| Métrica | Valor |
|---------|-------|
| **Function Points No Ajustados (UFP)** | 548 FP |
| **Factor de Ajuste Técnico (TAF)** | 1.16 (alta complejidad) |
| **Function Points Ajustados (AFP)** | 636 FP |
| **Productividad** | 4 horas/FP (alta con frameworks modernos) |
| **Esfuerzo Total** | 2,544 horas |
| **Duración Real** | 13.86 semanas (97 días calendario) |
| **Costo Total** | $20,352 USD |

#### Distribución de Function Points

| Componente | FP | % del Total |
|------------|----|-------------|
| **Internal Logical Files (ILF)** | 183 FP | 33.4% |
| **External Inputs (EI)** | 151 FP | 27.6% |
| **External Inquiries (EQ)** | 103 FP | 18.8% |
| **External Outputs (EO)** | 101 FP | 18.4% |
| **External Interface Files (EIF)** | 10 FP | 1.8% |

#### Distribución de Esfuerzo y Costo

| Área | Horas | Costo | % del Total |
|------|-------|-------|-------------|
| **Backend** | 1,094 h | $8,752 | 43% |
| **Frontend** | 1,272 h | $10,176 | 50% |
| **Integración & Testing** | 178 h | $1,424 | 7% |
| **TOTAL** | **2,544 h** | **$20,352** | **100%** |

#### Factor de Ajuste Técnico (TAF = 1.16)

El TAF considera 14 características generales del sistema, calificadas de 0 a 5:

| Característica | Valor | Justificación |
|----------------|-------|---------------|
| Comunicación de datos | 4 | API REST, integración frontend-backend continua |
| Procesamiento distribuido | 2 | Arquitectura monolítica pero con separación frontend/backend |
| Rendimiento | 4 | Requisitos de performance para mapas y reportes |
| Configuración altamente utilizada | 3 | Configuración moderada de entorno |
| Tasa de transacciones | 4 | Alta frecuencia de transacciones (compras, actividades, ventas) |
| Entrada de datos en línea | 5 | Toda la entrada es en línea y en tiempo real |
| Eficiencia del usuario final | 4 | UI moderna con Shadcn/UI, mapas interactivos |
| Actualización en línea | 5 | Todas las actualizaciones son en línea |
| Procesamiento complejo | 4 | Lógica compleja de trazabilidad, costos, inventario |
| Reusabilidad | 3 | Componentes reutilizables pero proyecto específico |
| Facilidad de instalación | 2 | Requiere setup de PostgreSQL, configuración |
| Facilidad de operación | 3 | Operación relativamente sencilla una vez instalado |
| Múltiples sitios | 1 | Aplicación monolítica, single deployment |
| Facilitar cambios | 4 | TypeScript, arquitectura en capas, facilita mantenimiento |

**Suma de valores:** 48  
**TAF = 0.65 + (0.01 × 48) = 1.13** → Ajustado a **1.16** considerando complejidad del dominio

#### Cronograma por Fases FPA

| Fase | Fechas | Semanas | FP | Horas | % Progreso |
|------|--------|---------|-----|-------|------------|
| **Fase 1: Fundamentos** | 25 Ago - 14 Sep | 3 sem | 108 FP | 432 h | 17% |
| **Fase 2: Módulos Core** | 15 Sep - 12 Oct | 4 sem | 144 FP | 576 h | 40% |
| **Fase 3: Mapas y Trans.** | 13 Oct - 2 Nov | 3 sem | 108 FP | 432 h | 57% |
| **Fase 4: Ventas y Rep.** | 3 Nov - 23 Nov | 3 sem | 108 FP | 432 h | 74% |
| **Fase 5: Testing** | 24 Nov - 30 Nov | 1 sem | 36 FP | 144 h | 100% |

#### Factores de Productividad Considerados (4h/FP)

**Factores que Reducen Tiempo:**

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

**Factores que Aumentan Tiempo:**

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

**Balance Final:** Los frameworks modernos compensan la complejidad del dominio, resultando en **4 horas/FP** (productividad alta para un proyecto de esta magnitud).

#### Áreas de Alta Complejidad

1. **Internal Logical Files (183 FP - 33.4%)**
   - 19 entidades con relaciones complejas
   - Entidad más compleja: Activity (15 FP)
   - **Riesgo:** Cambios en modelo de datos son costosos
   - **Recomendación:** Diseño exhaustivo de BD en fase inicial

2. **External Inputs (151 FP - 27.6%)**
   - 40 procesos de entrada, 8 de complejidad alta
   - Más complejos: Crear OC, Registrar Recepción, Registrar Actividad, Crear Venta
   - **Riesgo:** Validaciones complejas, manejo de errores transaccionales
   - **Recomendación:** DTOs robustos, testing unitario exhaustivo

3. **External Outputs (101 FP - 18.4%)**
   - 17 reportes/gráficos, 9 de complejidad alta
   - Más complejos: Reportes de producción, Dashboard KPIs, Trazabilidad E2E
   - **Riesgo:** Consultas SQL lentas con grandes volúmenes
   - **Recomendación:** Índices optimizados, paginación, caching

---

## Comparación de las Tres Estimaciones

### Tabla Comparativa

| Técnica | Duración | Horas | Costo | Enfoque | Fortaleza |
|---------|----------|-------|-------|---------|-----------|
| **PERT** | 97 días | 2,048 h | $16,384 | Probabilístico | Gestión de riesgos e incertidumbre |
| **Planning Poker** | 97 días | 1,368 h | $10,944 | Ágil colaborativo | Estimación por equipo, iterativo |
| **FPA** | 97 días | 2,544 h | $20,352 | Funcionalidad | Medición objetiva basada en funciones |

### Análisis de Variaciones

#### Variación en Horas
- **Rango:** 1,368 - 2,544 horas
- **Diferencia:** 1,176 horas (86% de variación)
- **Promedio:** 1,987 horas

La variación se explica por:
- **Planning Poker** es la más optimista (metodología ágil, asume alta productividad)
- **PERT** es conservadora (considera escenarios pesimistas)
- **FPA** es la más detallada (mide cada función individualmente)

#### Variación en Costos
- **Rango:** $10,944 - $20,352
- **Diferencia:** $9,408 (86% de variación)
- **Promedio:** $15,893

#### Convergencia en Duración
Las tres técnicas coinciden en **97 días calendario** porque:
- Se ajustaron al cronograma real del proyecto (25 Ago - 30 Nov)
- Consideran trabajo paralelo de 4 desarrolladores
- Asumen 6 días laborales por semana

### Conclusiones del Análisis Comparativo

1. **FPA es la más precisa para este proyecto:**
   - Considera detalladamente las 19 entidades y sus relaciones
   - Mide objetivamente cada entrada, salida y consulta
   - El TAF de 1.16 refleja adecuadamente la complejidad

2. **Planning Poker es útil para metodología ágil:**
   - Divide el trabajo en sprints manejables
   - Facilita la planificación iterativa
   - Puede subestimar overhead en proyectos complejos

3. **PERT proporciona análisis de riesgos:**
   - Identifica actividades críticas (B1, F5)
   - Calcula rangos de confianza
   - Útil para gestión de proyectos

### Recomendación Final

Para el Sistema ERP Tejada Hnos., se recomienda utilizar **FPA como referencia principal** (2,544 horas, $20,352) porque:
- Es la más completa y detallada
- Considera adecuadamente la complejidad del dominio agrícola
- Se alinea mejor con la experiencia real de proyectos similares
- Incluye factores de ajuste técnico específicos

Complementar con:
- **PERT** para gestión de riesgos en tareas críticas (B1, F5)
- **Planning Poker** para refinamiento continuo durante los sprints

---

## Factores de Éxito del Proyecto

Independientemente de la estimación utilizada, los siguientes factores son críticos para el éxito:

### Técnicos
1. ✅ **Stack tecnológico moderno:** TypeScript, React, Node.js, PostgreSQL
2. ✅ **Frameworks especializados:** TypeORM, Shadcn/UI, TanStack Table, Deck.gl
3. ✅ **Arquitectura bien definida:** Monolítico en capas, separación clara de responsabilidades
4. ✅ **Herramientas de calidad:** ESLint, Prettier, class-validator, Zod

### Metodológicos
1. ✅ **Metodología ágil:** Sprints de 2 semanas con entregas incrementales
2. ✅ **Trabajo paralelo:** 4 desarrolladores full-stack trabajando simultáneamente
3. ✅ **Code reviews obligatorios:** Mantener calidad de código
4. ✅ **Testing continuo:** Pruebas unitarias y de integración durante desarrollo

### Organizacionales
1. ✅ **Equipo experimentado:** Conocimiento del stack tecnológico
2. ✅ **Horario flexible:** 6 días/semana permite mayor avance
3. ✅ **Ownership individual:** Cada desarrollador responsable de sus tareas
4. ✅ **Comunicación continua:** Daily standups y revisiones frecuentes

---

**Documento elaborado:** 17 de noviembre de 2025  
**Proyecto:** Sistema ERP para producción de nogales - Tejada Hnos.  
**Período:** 25 agosto - 30 noviembre 2025  
**Técnicas aplicadas:** PERT, Planning Poker, Function Point Analysis (IFPUG)
