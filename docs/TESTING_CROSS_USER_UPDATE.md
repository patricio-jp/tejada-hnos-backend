# 🔄 Actualización: Tests de Permisos Cross-User

## Nuevos Tests Agregados

Se han agregado **tests adicionales** para validar exhaustivamente que los usuarios **solo acceden a sus propios recursos**, incluso cuando comparten el mismo rol.

### ✅ Usuarios de Prueba Agregados

Ahora cada test incluye:

| Rol | Usuarios | Propósito |
|-----|----------|-----------|
| ADMIN | 1 (admin) | Acceso total |
| CAPATAZ | 2 (capataz, capatazB) | Validar aislamiento entre capataces |
| OPERARIO | 3 (operario, operario2, operario3) | Validar aislamiento entre operarios |

---

## 📋 Tests Agregados por Flujo

### Flujo 1: Campos y Parcelas

#### **Nuevos Tests para Capataces (8 tests adicionales)**

1. **`should deny CAPATAZ_B access to CAPATAZ_A managed field`**
   - ✅ Capataz B **NO** puede acceder a un campo gestionado por Capataz A
   - Valida restricción de `managerId`

2. **`should allow each CAPATAZ to access only their own fields`**
   - ✅ Capataz A accede a Field A (su campo)
   - ✅ Capataz B accede a Field B (su campo)
   - ❌ Capataz A **NO** accede a Field B
   - ❌ Capataz B **NO** accede a Field A

3. **`should ensure CAPATAZ_A and CAPATAZ_B see only their own fields`**
   - ✅ Capataz A lista **solo** sus 2 campos
   - ✅ Capataz B lista **solo** su 1 campo
   - ✅ No ven campos del otro capataz
   - ✅ No ven campos sin gestor

**Escenario de Prueba:**
```typescript
// Campo A1, A2 → managerId: capataz.id
// Campo B1 → managerId: capatazB.id
// Campo Sin Gestor → managerId: null

GET /fields (capataz token)
// Response: [Campo A1, Campo A2] ✅

GET /fields (capatazB token)
// Response: [Campo B1] ✅
```

---

### Flujo 2: Órdenes de Trabajo y Actividades

#### **Nuevos Tests para Capataces (6 tests adicionales)**

1. **`should ensure CAPATAZ_A and CAPATAZ_B see only their managed fields work orders`**
   - ✅ Capataz A ve solo órdenes en Field A
   - ✅ Capataz B ve solo órdenes en Field B
   - ❌ No ven órdenes de campos del otro capataz

2. **`should deny CAPATAZ_B access to CAPATAZ_A managed field work order`**
   - ❌ Capataz B **NO** puede acceder a orden en campo de Capataz A

3. **`should deny CAPATAZ_B from approving activity in CAPATAZ_A managed field`**
   - ❌ Capataz B **NO** puede aprobar actividad en campo de Capataz A

4. **`should ensure each CAPATAZ can only approve activities in their managed fields`**
   - ✅ Capataz A aprueba actividad en Field A
   - ✅ Capataz B aprueba actividad en Field B
   - ❌ Capataz A **NO** aprueba actividad en Field B
   - ❌ Capataz B **NO** aprueba actividad en Field A

**Escenario de Prueba:**
```typescript
// Campo A → managerId: capataz.id
// Campo B → managerId: capatazB.id
// Orden A → plots en Campo A
// Orden B → plots en Campo B
// Actividad A → workOrderId: Orden A
// Actividad B → workOrderId: Orden B

PUT /activities/{activityA.id} (capataz token)
{ status: 'APPROVED' }
// Response: 200 ✅

PUT /activities/{activityB.id} (capataz token)
{ status: 'APPROVED' }
// Response: 403 ❌ (no puede aprobar en campo ajeno)
```

#### **Nuevos Tests para Operarios (10 tests adicionales)**

1. **`should ensure each OPERARIO sees only their assigned work orders`**
   - ✅ Operario 1 ve solo orden asignada a él
   - ✅ Operario 2 ve solo orden asignada a él
   - ✅ Operario 3 ve solo orden asignada a él
   - ❌ No ven órdenes de otros operarios

2. **`should deny OPERARIO_2 access to OPERARIO_1 assigned work order`**
   - ❌ Operario 2 **NO** puede acceder a orden asignada a Operario 1

3. **`should ensure each OPERARIO can only access their own work orders`**
   - ✅ Operario 1 accede a WO1 (asignada a él)
   - ✅ Operario 2 accede a WO2 (asignada a él)
   - ❌ Operario 1 **NO** accede a WO2
   - ❌ Operario 2 **NO** accede a WO1

4. **`should ensure OPERARIO can only update their own activities`**
   - ✅ Operario 1 actualiza su propia actividad
   - ✅ Operario 2 actualiza su propia actividad
   - ❌ Operario 1 **NO** actualiza actividad de Operario 2
   - ❌ Operario 2 **NO** actualiza actividad de Operario 1

**Escenario de Prueba:**
```typescript
// Orden 1 → assignedToId: operario.id
// Orden 2 → assignedToId: operario2.id
// Orden 3 → assignedToId: operario3.id
// Actividad 1 → workOrderId: Orden 1
// Actividad 2 → workOrderId: Orden 2

GET /work-orders (operario token)
// Response: [Orden 1] ✅

GET /work-orders (operario2 token)
// Response: [Orden 2] ✅

GET /work-orders/{orden2.id} (operario token)
// Response: 403 ❌

PUT /activities/{actividad2.id} (operario token)
{ hoursWorked: 10 }
// Response: 403 ❌ (no puede actualizar actividad de otro)
```

---

## 📊 Resumen de Cobertura Adicional

### Total de Tests Agregados: **~24 tests**

| Flujo | Tests Originales | Tests Nuevos | Total |
|-------|------------------|--------------|-------|
| Campos y Parcelas | ~40 | +8 | **~48** |
| Órdenes y Actividades | ~50 | +16 | **~66** |
| **TOTAL** | **~90** | **+24** | **~114** |

---

## 🎯 Validaciones Clave

### ✅ Aislamiento entre Capataces
- Cada capataz **solo** ve y gestiona sus campos
- Capataz A **NO** puede:
  - Ver campos de Capataz B
  - Acceder órdenes en campos de Capataz B
  - Aprobar actividades en campos de Capataz B

### ✅ Aislamiento entre Operarios
- Cada operario **solo** ve órdenes asignadas a él
- Operario 1 **NO** puede:
  - Ver órdenes asignadas a Operario 2
  - Acceder detalles de órdenes de Operario 2
  - Actualizar actividades de Operario 2

### ✅ Permisos por Campo (managerId)
```typescript
// Capataz A
managerId === capataz.id → ✅ Acceso completo
managerId === capatazB.id → ❌ Acceso denegado
managerId === null → ❌ Acceso denegado

// Capataz B
managerId === capatazB.id → ✅ Acceso completo
managerId === capataz.id → ❌ Acceso denegado
managerId === null → ❌ Acceso denegado
```

### ✅ Permisos por Orden (assignedToId)
```typescript
// Operario 1
assignedToId === operario.id → ✅ Acceso completo
assignedToId === operario2.id → ❌ Acceso denegado
assignedToId === null → ❌ Acceso denegado

// Operario 2
assignedToId === operario2.id → ✅ Acceso completo
assignedToId === operario.id → ❌ Acceso denegado
assignedToId === null → ❌ Acceso denegado
```

---

## 🔍 Casos de Uso Validados

### Caso 1: Múltiples Capataces en la Misma Empresa
**Situación Real:**
- Capataz Juan gestiona campos del norte
- Capataz Pedro gestiona campos del sur

**Tests Validados:**
- ✅ Juan **NO** ve campos de Pedro
- ✅ Pedro **NO** ve campos de Juan
- ✅ Juan **NO** puede aprobar actividades en campos de Pedro
- ✅ Pedro **NO** puede aprobar actividades en campos de Juan

### Caso 2: Múltiples Operarios Trabajando
**Situación Real:**
- Operario María asignada a poda
- Operario Carlos asignado a riego
- Operario Ana asignada a cosecha

**Tests Validados:**
- ✅ María ve **solo** su orden de poda
- ✅ Carlos ve **solo** su orden de riego
- ✅ Ana ve **solo** su orden de cosecha
- ✅ Ninguno puede ver/modificar órdenes de otros

### Caso 3: Workflow Completo con Aislamiento
**Flujo:**
```
1. Admin crea Orden A → assignedTo: Operario 1
2. Admin crea Orden B → assignedTo: Operario 2
3. Operario 1 registra actividad en Orden A → ✅
4. Operario 2 intenta acceder Orden A → ❌ 403
5. Capataz A aprueba actividad de Orden A → ✅
6. Capataz B intenta aprobar actividad de Orden A → ❌ 403
```

---

## 🚀 Ejecutar los Nuevos Tests

```bash
# Todos los tests (incluye los nuevos)
npm test

# Solo tests E2E
npm run test:e2e

# Ver resultados detallados
npm test -- --verbose
```

### Resultado Esperado
```
PASS  tests/e2e/fields-plots.test.ts
  E2E: Fields and Plots Flow
    GET /fields - List all fields
      ✓ should ensure CAPATAZ_A and CAPATAZ_B see only their own fields
    GET /fields/:id - Get field by ID
      ✓ should deny CAPATAZ_B access to CAPATAZ_A managed field
      ✓ should allow each CAPATAZ to access only their own fields
    ... (+48 tests)

PASS  tests/e2e/work-orders-activities.test.ts
  E2E: Work Orders and Activities Flow
    GET /work-orders - List work orders
      ✓ should ensure CAPATAZ_A and CAPATAZ_B see only their managed fields work orders
      ✓ should ensure each OPERARIO sees only their assigned work orders
    GET /work-orders/:id - Get work order by ID
      ✓ should deny CAPATAZ_B access to CAPATAZ_A managed field work order
      ✓ should deny OPERARIO_2 access to OPERARIO_1 assigned work order
      ✓ should ensure each OPERARIO can only access their own work orders
    PUT /activities/:id - Update activity
      ✓ should deny CAPATAZ_B from approving activity in CAPATAZ_A managed field
      ✓ should ensure each CAPATAZ can only approve activities in their managed fields
      ✓ should ensure OPERARIO can only update their own activities
    ... (+66 tests)

Test Suites: 2 passed, 2 total
Tests:       114 passed, 114 total
```

---

## 📝 Notas Importantes

1. **Usuarios Creados Automáticamente**: En cada test se crean automáticamente:
   - 1 Admin
   - 2 Capataces (capataz, capatazB)
   - 3 Operarios (operario, operario2, operario3)

2. **Limpieza Entre Tests**: La base de datos se limpia antes de cada test, garantizando independencia.

3. **Validación en BD**: Los tests críticos verifican el estado en PostgreSQL directamente.

4. **Cobertura Completa**: Ahora se valida:
   - ✅ Acceso permitido (200)
   - ✅ Acceso denegado (403)
   - ✅ Cross-user restrictions
   - ✅ Aislamiento por `managerId`
   - ✅ Aislamiento por `assignedToId`

---

**Actualizado**: Noviembre 2025  
**Tests Totales**: ~114  
**Cobertura**: Aislamiento multi-usuario completo
