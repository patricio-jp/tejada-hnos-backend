# Estimación PERT - Sistema ERP Tejada Hnos.

## Técnica: Program Evaluation and Review Technique (PERT)

### Fórmula PERT
**Tiempo Esperado (TE) = (Optimista + 4×Más Probable + Pesimista) / 6**

### Parámetros del Proyecto
- **Equipo:** 4 desarrolladores (2 backend, 2 frontend)
- **Tarifa por hora:** $8 USD
- **Horas laborales por día:** 8 horas
- **Días laborales por semana:** 5 días

---

## Estimaciones por Actividad

### Fase Inicial: Planificación y Configuración

#### 1. Reuniones e ingeniería de requisitos
- **Optimista (O):** 3 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (3 + 4×5 + 8) / 6 = **5.17 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 4 devs = 160 horas
- **Costo:** 160 × $8 = **$1,280**

#### 2. Diseño de la arquitectura del sistema
- **Optimista (O):** 4 días
- **Más Probable (M):** 6 días
- **Pesimista (P):** 10 días
- **TE:** (4 + 4×6 + 10) / 6 = **6.33 días** ≈ **6 días**
- **Horas:** 6 días × 8 horas × 4 devs = 192 horas
- **Costo:** 192 × $8 = **$1,536**

#### 3. Configuración de entorno de desarrollo y base de datos
- **Optimista (O):** 3 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (3 + 4×5 + 8) / 6 = **5.17 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 4 devs = 160 horas
- **Costo:** 160 × $8 = **$1,280**

---

### Backend (2 desarrolladores)

#### 4. B1: Implementación de entidades TypeORM, DTOs y validaciones
- **Optimista (O):** 8 días
- **Más Probable (M):** 10 días
- **Pesimista (P):** 15 días
- **TE:** (8 + 4×10 + 15) / 6 = **10.5 días** ≈ **11 días**
- **Horas:** 11 días × 8 horas × 2 devs = 176 horas
- **Costo:** 176 × $8 = **$1,408**

#### 5. B2: Sistema de autenticación JWT, roles y autorización
- **Optimista (O):** 8 días
- **Más Probable (M):** 10 días
- **Pesimista (P):** 14 días
- **TE:** (8 + 4×10 + 14) / 6 = **10.33 días** ≈ **10 días**
- **Horas:** 10 días × 8 horas × 2 devs = 160 horas
- **Costo:** 160 × $8 = **$1,280**

#### 6. B3: Endpoints CRUD para entidades maestras
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 7. B4: Lógica transaccional de Compras con seguimiento
- **Optimista (O):** 8 días
- **Más Probable (M):** 10 días
- **Pesimista (P):** 14 días
- **TE:** (8 + 4×10 + 14) / 6 = **10.33 días** ≈ **10 días**
- **Horas:** 10 días × 8 horas × 2 devs = 160 horas
- **Costo:** 160 × $8 = **$1,280**

#### 8. B5: Endpoints CRUD para Campos y Parcelas con GeoJSON
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 9. B6: Endpoints CRUD para Órdenes de Trabajo
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 7 días
- **TE:** (4 + 4×5 + 7) / 6 = **5.17 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 10. B7: Lógica transaccional de Actividades con uso de insumos
- **Optimista (O):** 6 días
- **Más Probable (M):** 8 días
- **Pesimista (P):** 12 días
- **TE:** (6 + 4×8 + 12) / 6 = **8.33 días** ≈ **8 días**
- **Horas:** 8 días × 8 horas × 2 devs = 128 horas
- **Costo:** 128 × $8 = **$1,024**

#### 11. B8: Sistema de Lotes de Cosecha con trazabilidad
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 12. B9: Lógica transaccional de Ventas con asignación de lotes
- **Optimista (O):** 5 días
- **Más Probable (M):** 7 días
- **Pesimista (P):** 10 días
- **TE:** (5 + 4×7 + 10) / 6 = **7.17 días** ≈ **7 días**
- **Horas:** 7 días × 8 horas × 2 devs = 112 horas
- **Costo:** 112 × $8 = **$896**

#### 13. B10: Lógica transaccional de Envíos con tracking
- **Optimista (O):** 4 días
- **Más Probable (M):** 6 días
- **Pesimista (P):** 9 días
- **TE:** (4 + 4×6 + 9) / 6 = **6.17 días** ≈ **6 días**
- **Horas:** 6 días × 8 horas × 2 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 14. B11: Endpoints de Reportes con métricas y analytics
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 15. B12: Endpoint de trazabilidad End-to-End (E2E)
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

---

### Frontend (2 desarrolladores)

#### 16. F1: Sistema de diseño y componentes base con Shadcn/UI
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 17. F2: Autenticación, manejo de roles y ruteo protegido
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 18. F3: Interfaces CRUD para maestros de datos
- **Optimista (O):** 4 días
- **Más Probable (M):** 5 días
- **Pesimista (P):** 8 días
- **TE:** (4 + 4×5 + 8) / 6 = **5.33 días** ≈ **5 días**
- **Horas:** 5 días × 8 horas × 2 devs = 80 horas
- **Costo:** 80 × $8 = **$640**

#### 19. F4: Módulo de Compras con gestión de órdenes y recepciones
- **Optimista (O):** 8 días
- **Más Probable (M):** 10 días
- **Pesimista (P):** 14 días
- **TE:** (8 + 4×10 + 14) / 6 = **10.33 días** ≈ **10 días**
- **Horas:** 10 días × 8 horas × 2 devs = 160 horas
- **Costo:** 160 × $8 = **$1,280**

#### 20. F5: Módulo de Campos y Parcelas con mapas interactivos
- **Optimista (O):** 15 días
- **Más Probable (M):** 20 días
- **Pesimista (P):** 28 días
- **TE:** (15 + 4×20 + 28) / 6 = **20.5 días** ≈ **21 días**
- **Horas:** 21 días × 8 horas × 2 devs = 336 horas
- **Costo:** 336 × $8 = **$2,688**

#### 21. F6: Módulo de Órdenes de Trabajo (Rol: Capataz)
- **Optimista (O):** 6 días
- **Más Probable (M):** 8 días
- **Pesimista (P):** 12 días
- **TE:** (6 + 4×8 + 12) / 6 = **8.33 días** ≈ **8 días**
- **Horas:** 8 días × 8 horas × 2 devs = 128 horas
- **Costo:** 128 × $8 = **$1,024**

#### 22. F7: Módulo de Actividades (Rol: Operario)
- **Optimista (O):** 4 días
- **Más Probable (M):** 6 días
- **Pesimista (P):** 9 días
- **TE:** (4 + 4×6 + 9) / 6 = **6.17 días** ≈ **6 días**
- **Horas:** 6 días × 8 horas × 2 devs = 96 horas
- **Costo:** 96 × $8 = **$768**

#### 23. F8: Módulo de Lotes de Cosecha con inventario visual
- **Optimista (O):** 3 días
- **Más Probable (M):** 4 días
- **Pesimista (P):** 6 días
- **TE:** (3 + 4×4 + 6) / 6 = **4.17 días** ≈ **4 días**
- **Horas:** 4 días × 8 horas × 2 devs = 64 horas
- **Costo:** 64 × $8 = **$512**

#### 24. F9: Módulo de Ventas con asignación de lotes
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 25. F10: Módulo de Envíos con tracking de entregas
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
- **Horas:** 3 días × 8 horas × 2 devs = 48 horas
- **Costo:** 48 × $8 = **$384**

#### 26. F11: Módulo de Reportes con visualizaciones y gráficos
- **Optimista (O):** 2 días
- **Más Probable (M):** 3 días
- **Pesimista (P):** 5 días
- **TE:** (2 + 4×3 + 5) / 6 = **3.17 días** ≈ **3 días**
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
| **Planificación y Configuración** | 16 días | 512 horas | $4,096 |
| **Backend** | 83 días | 1,328 horas | $10,624 |
| **Frontend** | 76 días | 1,216 horas | $9,728 |
| **Testing Final** | 3 días | 96 horas | $768 |

### Total del Proyecto

| Métrica | Valor |
|---------|-------|
| **Duración Total Estimada** | **78 días calendario** (considerando trabajo paralelo) |
| **Horas Totales de Desarrollo** | **3,152 horas** |
| **Costo Total del Proyecto** | **$25,216 USD** |

### Distribución de Costos

- **Planificación y Configuración:** 16.2% ($4,096)
- **Backend:** 42.1% ($10,624)
- **Frontend:** 38.6% ($9,728)
- **Testing Final:** 3.0% ($768)

---

## Análisis de Riesgo PERT

### Desviación Estándar (σ)
**σ = (P - O) / 6**

### Varianza (σ²)
**σ² = [(P - O) / 6]²**

### Cálculo de Riesgo para Actividades Críticas

#### F5: Módulo de Campos y Parcelas con mapas (Mayor riesgo)
- **σ:** (28 - 15) / 6 = **2.17 días**
- **Confianza 95%:** 21 ± (1.96 × 2.17) = **16.75 a 25.25 días**

#### B1: Implementación de entidades TypeORM (Alto riesgo)
- **σ:** (15 - 8) / 6 = **1.17 días**
- **Confianza 95%:** 11 ± (1.96 × 1.17) = **8.71 a 13.29 días**

---

## Recomendaciones

1. **Buffer de tiempo:** Agregar 15% de buffer para imprevistos = **12 días adicionales**
2. **Duración realista del proyecto:** **90 días calendario** (≈ 4 meses)
3. **Presupuesto con contingencia:** $25,216 + 15% = **$29,000 USD**
4. **Actividades de alto riesgo a monitorear:**
   - F5: Módulo de mapas interactivos (alta complejidad técnica)
   - B1: Modelado de datos (fundamental para el resto del proyecto)
   - B7: Lógica de actividades (lógica transaccional compleja)

---

**Fecha de estimación:** 15 de noviembre de 2025  
**Metodología:** PERT (Program Evaluation and Review Technique)  
**Equipo:** 4 desarrolladores (2 backend + 2 frontend)
