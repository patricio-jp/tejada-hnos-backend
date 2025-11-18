# Estimación PERT Realista - Sistema ERP Tejada Hnos.

## Técnica: Program Evaluation and Review Technique (PERT)

### Fórmula PERT
**Tiempo Esperado (TE) = (Optimista + 4×Más Probable + Pesimista) / 6**

### Parámetros del Proyecto
- **Equipo:** 4 desarrolladores full-stack (trabajo paralelo y colaborativo)
- **Tarifa por hora:** $8 USD
- **Horas laborales:** Horario flexible (promedio 8 horas por día)
- **Días laborales por semana:** 6 días (lunes a sábado)
- **Duración del proyecto:** 25 agosto - 30 noviembre 2025 (97 días calendario / 83 días laborales)

---

## Estimaciones por Actividad

### Fase Inicial: Planificación y Configuración

#### 1. Reuniones e ingeniería de requisitos
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 4 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 2. Diseño de la arquitectura del sistema
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 4 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 3. Configuración de entorno de desarrollo y base de datos
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 4 días
- **TE:** (2 + 4×3 + 4) / 6 = **3 días**
- **Horas:** 3 días × 8 horas × 4 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

---

### Backend (2 desarrolladores)

#### 4. B1: Implementación de entidades TypeORM, DTOs y validaciones
- **Optimista (O):** 5 días
- **Más Probable (M):** 7 días
- **Pesimista (P):** 10 días
- **TE:** (5 + 4×7 + 10) / 6 = **7.17 días** ≈ **7 días**
- **Horas:** 7 días × 8 horas × 2 devs = 112 horas
- **Costo:** 112 × $8 = **$896**

#### 5. B2: Sistema de autenticación JWT, roles y autorización
- **Optimista (O):** 5 días
- **Más Probable (M):** 6 días
- **Pesimista (P):** 9 días
- **TE:** (5 + 4×6 + 9) / 6 = **6.33 días** ≈ **6 días**
- **Horas:** 6 días × 8 horas × 2 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 6. B3: Endpoints CRUD para entidades maestras
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 7. B4: Lógica transaccional de Compras con seguimiento
- **Optimista (O):** 5 días
- **Más Probable (M):** 6 días
- **Pesimista (P):** 9 días
- **TE:** (5 + 4×6 + 9) / 6 = **6.33 días** ≈ **6 días**
- **Horas:** 6 días × 8 horas × 2 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 8. B5: Endpoints CRUD para Campos y Parcelas con GeoJSON
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 9. B6: Endpoints CRUD para Órdenes de Trabajo
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 10. B7: Lógica transaccional de Actividades con uso de insumos
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 11. B8: Sistema de Lotes de Cosecha con trazabilidad
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 12. B9: Lógica transaccional de Ventas con asignación de lotes
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 13. B10: Lógica transaccional de Envíos con tracking
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 14. B11: Endpoints de Reportes con métricas y analytics
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 4 días
- **TE:** (2 + 4×3 + 4) / 6 = **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 15. B12: Endpoint de trazabilidad End-to-End (E2E)
- **Optimista (O):** 1 día
- **Más Probable (M):** 2 días
- **Pesimista (P):** 3 días
- **TE:** (1 + 4×2 + 3) / 6 = **2 días**
- **Horas:** 2 días × 8 horas × 2 devs = 32 horas
- **Costo:** 32 × $8 = **$256**

---

### Frontend (2 desarrolladores)

#### 16. F1: Sistema de diseño y componentes base con Shadcn/UI
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 17. F2: Autenticación, manejo de roles y ruteo protegido
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 18. F3: Interfaces CRUD para maestros de datos
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 19. F4: Módulo de Compras con gestión de órdenes y recepciones
- **Optimista (O):** 5 días
- **Más Probable (M):** 7 días
- **Pesimista (P):** 10 días
- **TE:** (5 + 4×7 + 10) / 6 = **7.17 días** ≈ **7 días**
- **Horas:** 7 días × 8 horas × 2 devs = 112 horas
- **Costo:** 112 × $8 = **$896**

#### 20. F5: Módulo de Campos y Parcelas con mapas interactivos
- **Optimista (O):** 10 días
- **Más Probable (M):** 13 días
- **Pesimista (P):** 18 días
- **TE:** (10 + 4×13 + 18) / 6 = **13.33 días** ≈ **13 días**
- **Horas:** 13 días × 8 horas × 2 devs = 208 horas
- **Costo:** 208 × $8 = **$1,664**

#### 21. F6: Módulo de Órdenes de Trabajo (Rol: Capataz)
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 22. F7: Módulo de Actividades (Rol: Operario)
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 23. F8: Módulo de Lotes de Cosecha con inventario visual
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 24. F9: Módulo de Ventas con asignación de lotes
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 4 días
- **TE:** (2 + 4×3 + 4) / 6 = **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 25. F10: Módulo de Envíos con tracking de entregas
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 4 días
- **TE:** (2 + 4×3 + 4) / 6 = **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 26. F11: Módulo de Reportes con visualizaciones y gráficos
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 4 días
- **TE:** (2 + 4×3 + 4) / 6 = **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

---

### Fase Final

#### 29. Pruebas End-to-End integrales y preparación de entrega
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 4 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

---

## Resumen de Estimación PERT

### Por Fase

| Fase | Días Estimados | Horas Totales | Costo Total |
|------|----------------|---------------|-------------|
| **Planificación y Configuración** | 9 días | 288 horas | $2,304 |
| **Backend** | 50 días | 800 horas | $6,400 |
| **Frontend** | 54 días | 864 horas | $6,912 |
| **Testing Final** | 3 días | 96 horas | $768 |

### Total del Proyecto

| Métrica | Valor |
|---------|-------|
| **Duración Total Estimada** | **97 días calendario / 83 días laborales** (25 Ago - 30 Nov 2025) |
| **Horas Totales de Desarrollo** | **2,048 horas** |
| **Costo Total del Proyecto** | **$16,384 USD** |
| **Días de trabajo por semana** | **6 días** (lunes a sábado) |

### Distribución de Costos

- **Planificación y Configuración:** 14.1% ($2,304)
- **Backend:** 39.1% ($6,400)
- **Frontend:** 42.2% ($6,912)
- **Testing Final:** 4.7% ($768)

---

## Análisis de Riesgo PERT

### Desviación Estándar (σ)
**σ = (P - O) / 6**

### Varianza (σ²)
**σ² = [(P - O) / 6]²**

### Cálculo de Riesgo para Actividades Críticas

#### F5: Módulo de Campos y Parcelas con mapas (Mayor riesgo)
- **σ:** (18 - 10) / 6 = **1.33 días**
- **Confianza 95%:** 13 ± (1.96 × 1.33) = **10.39 a 15.61 días**

#### B1: Implementación de entidades TypeORM
- **σ:** (10 - 5) / 6 = **0.83 días**
- **Confianza 95%:** 7 ± (1.96 × 0.83) = **5.37 a 8.63 días**

#### F4: Módulo de Compras
- **σ:** (10 - 5) / 6 = **0.83 días**
- **Confianza 95%:** 7 ± (1.96 × 0.83) = **5.37 a 8.63 días**

---

## Camino Crítico del Proyecto

### Dependencias Principales

1. **Sprint 0 (Planificación)** → Todo el proyecto depende de esto
2. **B1 (Entidades)** → Todas las demás actividades de backend
3. **F5 (Mapas)** → Actividad más larga del frontend, determina el ritmo
4. **Testing Final** → Última fase antes de entrega

### Holgura por Actividad

| Actividad | Duración | Holgura | ¿Es Crítica? |
|-----------|----------|---------|--------------|
| B1 (Entidades) | 7 días | 0 días | ✅ Sí |
| F5 (Mapas) | 13 días | 0 días | ✅ Sí |
| B4 (Compras) | 6 días | 2 días | ❌ No |
| F4 (Compras UI) | 7 días | 1 día | ❌ No |
| Testing Final | 3 días | 0 días | ✅ Sí |

---

## Distribución de Esfuerzo por Desarrollador

### Backend Developer (cada uno)

| Fase | Horas |
|------|-------|
| Planificación | 72 h |
| Desarrollo Backend (B1-B12) | 400 h |
| Code Review & Testing | 50 h |
| Reuniones & Overhead | 28 h |
| **Total por Backend Dev** | **550 horas** |

### Frontend Developer (cada uno)

| Fase | Horas |
|------|-------|
| Planificación | 72 h |
| Desarrollo Frontend (F1-F11) | 432 h |
| Code Review & Testing | 50 h |
| Reuniones & Overhead | 28 h |
| **Total por Frontend Dev** | **582 horas** |

---

## Timeline del Proyecto (97 días calendario / 83 días laborales)

### Fecha de inicio: 25 de agosto de 2025
### Fecha de finalización: 30 de noviembre de 2025

**Nota:** El equipo trabaja 6 días a la semana (lunes a sábado) con horarios flexibles, lo que permite mayor avance que una semana laboral estándar de 5 días.

---

### Sprint 0 (25 Ago - 31 Ago): Planificación y Fundamentos
**Duración:** 6 días laborales

- **25-27 Ago:** Reuniones e ingeniería de requisitos (3 días)
- **28-30 Ago:** Diseño de la arquitectura del sistema (3 días)
- **31 Ago:** Configuración de entorno de desarrollo y base de datos (parte 1)

### Sprint 1 (1 Sep - 14 Sep): Entidades, Autenticación y Maestros
**Duración:** 12 días laborales

- **1-2 Sep:** Configuración de entorno (continuación, 2 días restantes)
- **3-10 Sep:** B1: Implementación de entidades TypeORM (7 días, 2 devs backend)
- **3-5 Sep:** F1: Sistema de diseño y componentes base (3 días, inicio paralelo)
- **6-8 Sep:** F2: Autenticación, roles y ruteo protegido (3 días)
- **9-11 Sep:** F3: Interfaces CRUD para maestros (3 días)
- **11-14 Sep:** B2: Sistema de autenticación JWT (4 días de 6 asignados)

### Sprint 2 (15 Sep - 28 Sep): Autenticación Backend y Compras
**Duración:** 12 días laborales

- **15-16 Sep:** B2: Autenticación JWT (finalización, 2 días restantes)
- **17-19 Sep:** B3: Endpoints CRUD para maestros (3 días)
- **20-27 Sep:** B4: Lógica transaccional de Compras (6 días)
- **15-23 Sep:** F4: Módulo de Compras UI (7 días, paralelo)
- **24-28 Sep:** F5: Módulo de Campos y Parcelas - Mapas (inicio, 5 días)

### Sprint 3 (29 Sep - 14 Oct): Campos, Parcelas y Órdenes de Trabajo
**Duración:** 14 días laborales

- **29 Sep - 7 Oct:** F5: Mapas interactivos (continuación, 8 días restantes)
- **29 Sep - 2 Oct:** B5: Endpoints para Campos/Parcelas GeoJSON (4 días)
- **3-5 Oct:** B6: Endpoints CRUD para Órdenes de Trabajo (3 días)
- **6-11 Oct:** B7: Lógica transaccional de Actividades (5 días)
- **8-13 Oct:** F6: Módulo de Órdenes de Trabajo UI (5 días, paralelo)
- **14 Oct:** F7: Módulo de Actividades (inicio, 1 día)

### Sprint 4 (15 Oct - 28 Oct): Actividades, Lotes y Ventas
**Duración:** 12 días laborales

- **15-17 Oct:** F7: Módulo de Actividades UI (continuación, 3 días restantes)
- **12-15 Oct:** B8: Sistema de Lotes de Cosecha (4 días)
- **16-19 Oct:** B9: Lógica transaccional de Ventas (4 días)
- **18-20 Oct:** F8: Módulo de Lotes de Cosecha UI (3 días)
- **21-23 Oct:** F9: Módulo de Ventas UI (3 días)
- **24-26 Oct:** F10: Módulo de Envíos UI (3 días)
- **27-28 Oct:** F11: Módulo de Reportes UI (inicio, 2 días)

### Sprint 5 (29 Oct - 14 Nov): Envíos, Reportes y Trazabilidad
**Duración:** 15 días laborales

- **29 Oct:** F11: Módulo de Reportes UI (finalización, 1 día restante)
- **20-23 Oct:** B10: Lógica transaccional de Envíos (4 días)
- **24-26 Oct:** B11: Endpoints de Reportes (3 días)
- **27-28 Oct:** B12: Endpoint de trazabilidad E2E (2 días)
- **29 Oct - 14 Nov:** Revisiones de código, refactoring y optimización

### Sprint 6 (15 Nov - 30 Nov): Testing Final y Entrega
**Duración:** 14 días laborales

- **15-18 Nov:** Pruebas End-to-End integrales (4 días)
- **19-20 Nov:** Empaquetado multiplataforma (Electron/Capacitor) (2 días)
- **21-22 Nov:** Documentación final y guías de usuario (2 días)
- **23-30 Nov:** Buffer para correcciones finales y despliegue (6 días)

---

## Recomendaciones

1. **Priorizar B1 (Entidades):** Base fundamental del proyecto, debe completarse sin retrasos
2. **Asignar desarrollador Senior a F5:** La tarea más compleja requiere experiencia
3. **Buffer de 10 días:** Considerar agregar buffer para imprevistos (total: 68 días)
4. **Daily standups:** Esenciales para detectar bloqueos en camino crítico
5. **Pruebas incrementales:** No esperar al final, validar cada módulo al completarse

---

## Factores de Éxito Considerados

1. ✅ **Experiencia del equipo en el stack tecnológico**
2. ✅ **Uso de frameworks modernos (TypeORM, Shadcn/UI, Deck.gl)**
3. ✅ **Trabajo paralelo backend/frontend desde el inicio**
4. ✅ **Reutilización de componentes y servicios**
5. ✅ **Metodología ágil con entregas incrementales**

---

**Fecha de inicio:** 25 de agosto de 2025  
**Fecha de finalización:** 30 de noviembre de 2025  
**Metodología:** PERT (Program Evaluation and Review Technique)  
**Equipo:** 4 desarrolladores full-stack trabajando en paralelo  
**Consideraciones:** Estimación realista considerando experiencia del equipo, stack tecnológico moderno, trabajo 6 días/semana con horarios flexibles
