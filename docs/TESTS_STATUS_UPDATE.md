# Estado Actualizado de Tests E2E

**Fecha**: 7 de Noviembre, 2025  
**Última actualización**: Después de ajustes de permisos para visualización de mapas

---

## 📊 Resumen Ejecutivo

### Progreso General
- **Total de tests**: 76
- **Tests pasando**: **60** ✅ (78.9%)
- **Tests fallando**: **16** ❌ (21.1%)

### Comparación Histórica

| Momento | Passing | Failing | Porcentaje |
|---------|---------|---------|------------|
| Estado inicial | 21 | 55 | 27.6% |
| Después de fixes de estructura | 51 | 25 | 67.1% |
| **Actual (con ajuste maps)** | **60** | **16** | **78.9%** |

**Mejora total**: +39 tests (+51.3%)

---

## 🎯 Tests Arreglados en Esta Actualización (+9)

### Cambio de Requerimiento: Visualización de Mapas

**Decisión de negocio**: Los campos y parcelas deben ser visibles para **todos los roles autenticados** para permitir la visualización de mapas interactivos en el frontend.

### Tests Actualizados (Fields/Plots GET)

#### 1. GET /fields - List all fields (3 tests)
✅ `should allow CAPATAZ to see all fields (for map visualization)`  
✅ `should ensure CAPATAZ_A and CAPATAZ_B can see all fields (for map visualization)`  
✅ `should allow OPERARIO to see all fields (for map visualization)`

**Cambio aplicado**:
- **Antes**: CAPATAZ solo ve fields gestionados (`managerId = userId`)
- **Ahora**: CAPATAZ ve todos los fields (para renderizar mapas)
- **Antes**: OPERARIO recibe array vacío
- **Ahora**: OPERARIO ve todos los fields

#### 2. GET /fields/:id - Get field by ID (4 tests)
✅ `should allow CAPATAZ to get any field (for map visualization)`  
✅ `should allow CAPATAZ_B to access CAPATAZ_A managed field (for map visualization)`  
✅ `should allow each CAPATAZ to access all fields (for map visualization)`  
✅ `should allow OPERARIO to access any field (for map visualization)`

**Cambio aplicado**:
- **Antes**: CAPATAZ solo puede GET sus fields gestionados (403 en otros)
- **Ahora**: CAPATAZ puede GET cualquier field
- **Antes**: OPERARIO recibe 403
- **Ahora**: OPERARIO puede GET cualquier field

#### 3. GET /fields/:fieldId/plots - List plots (2 tests)
✅ `should allow CAPATAZ to get plots from any field (for map visualization)`  
✅ `should allow OPERARIO to access plots (for map visualization)`

**Cambio aplicado**:
- **Antes**: CAPATAZ solo puede ver plots de fields gestionados
- **Ahora**: CAPATAZ puede ver plots de cualquier field
- **Antes**: OPERARIO recibe 403
- **Ahora**: OPERARIO puede ver plots

---

## ❌ Tests Pendientes de Corrección (16)

### Categoría 1: Work Orders - Autorización Cross-Capataz (8 tests)

#### WO-1: `should deny CAPATAZ access to work order from unmanaged field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:347-361`
- **Esperado**: 403 Forbidden
- **Actual**: 200 OK
- **Causa**: Middleware no valida cross-capataz en GET

#### WO-2: `should deny CAPATAZ_B access to CAPATAZ_A managed field work order`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:363-398`
- **Esperado**: 403 Forbidden
- **Actual**: 200 OK
- **Causa**: Similar a WO-1

#### WO-3: `should ensure each OPERARIO can only access their own work orders`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:420-445`
- **Esperado**: 403 cuando OPERARIO_1 accede WO de OPERARIO_2
- **Actual**: Probablemente 200 OK
- **Causa**: Validación de `assignedToId` no funciona correctamente

#### WO-4: `should deny CAPATAZ from updating work order from unmanaged field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:700-720`
- **Esperado**: 403 Forbidden
- **Actual**: 200 OK
- **Causa**: PUT no valida cross-capataz

#### WO-5: `should deny CAPATAZ from deleting work order from unmanaged field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:790-810`
- **Esperado**: 403 Forbidden
- **Actual**: 200 OK
- **Causa**: DELETE no valida cross-capataz

#### WO-6: `should deny CAPATAZ_B from approving activity in CAPATAZ_A managed field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:1110-1140`
- **Esperado**: 403 Forbidden
- **Actual**: Probablemente 200 OK
- **Causa**: Actividades no validan cross-capataz

#### WO-7: `should ensure each CAPATAZ can only approve activities in their own fields`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:1142-1180`
- **Esperado**: 403 cross-capataz
- **Actual**: 200 OK
- **Causa**: Similar a WO-6

#### WO-8: `should ensure OPERARIO can only update their own activities`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:1225-1260`
- **Esperado**: 403 cuando OPERARIO_1 actualiza activity de OPERARIO_2
- **Actual**: Probablemente 200 OK
- **Causa**: Validación cross-operario no implementada

---

### Categoría 2: Work Orders - Creación (400 Bad Request) (5 tests)

#### WO-9: `should allow ADMIN to create a work order`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:539-575`
- **Esperado**: 201 Created
- **Actual**: 400 Bad Request
- **Causa**: Posible problema con DTO o validación

#### WO-10: `should allow CAPATAZ to create work order for managed field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:577-613`
- **Esperado**: 201 Created
- **Actual**: 400 Bad Request
- **Causa**: Similar a WO-9

#### WO-11: `should deny CAPATAZ from creating work order for unmanaged field`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:615-650`
- **Esperado**: 403 Forbidden
- **Actual**: 400 Bad Request
- **Causa**: DTO validation falla antes de llegar a middleware

#### WO-12: `should allow OPERARIO to create activity for assigned work order`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:820-860`
- **Esperado**: 201 Created
- **Actual**: 400 Bad Request
- **Causa**: Problema con `CreateActivityDto`

---

### Categoría 3: Filtrado de Datos (2 tests)

#### WO-13: `should allow CAPATAZ to see activities from managed fields`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:950-980`
- **Esperado**: Array filtrado con solo actividades de fields gestionados
- **Actual**: Array con todas las actividades
- **Causa**: Servicio no filtra por `managedFields`

---

### Categoría 4: Lógica de Negocio (1 test)

#### WO-14: `should allow OPERARIO to update their own pending activity`
- **Archivo**: `tests/e2e/work-orders-activities.test.ts:990-1020`
- **Esperado**: 200 OK
- **Actual**: 403 Forbidden
- **Causa**: Posible regla de negocio - OPERARIO no puede modificar PENDING

**Acción recomendada**: Verificar si OPERARIO debería poder modificar actividades PENDING o solo APPROVED/REJECTED.

---

## 🔧 Próximos Pasos Prioritarios

### 1. Alta Prioridad: Arreglar Creaciones (5 tests)

**Tests**: WO-9, WO-10, WO-11, WO-12

**Acción**:
```bash
# Ejecutar test individual con logs
npm test -- -t "should allow ADMIN to create a work order"
```

**Agregar debugging temporal**:
```typescript
console.log('Request data:', workOrderData);
console.log('Response status:', response.status);
console.log('Response body:', response.body);
```

**Posibles problemas**:
- `plotIds` inválido o vacío
- `scheduledDate`/`dueDate` formato incorrecto
- Validación adicional en servicio no documentada

---

### 2. Media Prioridad: Implementar Validación Cross-User (8 tests)

**Tests**: WO-1, WO-2, WO-3, WO-4, WO-5, WO-6, WO-7, WO-8

**Requiere modificar middleware**:
```typescript
// En authorizeFieldAccess middleware
// Agregar validación para GET, PUT, DELETE de work orders
```

**Opciones**:
1. Implementar validación completa en middleware
2. Documentar como limitación conocida
3. Marcar tests como `.skip()` hasta implementación futura

---

### 3. Baja Prioridad: Filtrado y Lógica de Negocio (3 tests)

**Tests**: WO-13, WO-14

**Acciones**:
- WO-13: Implementar filtrado por `managedFields` en servicio de actividades
- WO-14: Clarificar regla de negocio con stakeholders

---

## 📈 Métricas de Calidad

### Cobertura por Suite

| Suite | Total | Passing | Failing | % |
|-------|-------|---------|---------|---|
| **Work Orders & Activities** | 57 | 43 | 14 | 75.4% |
| **Fields & Plots** | 19 | 17 | 2 | 89.5% |

### Tests Fallidos por Tipo

| Tipo de Error | Cantidad | % del Total Fallido |
|---------------|----------|---------------------|
| Autorización Cross-User | 8 | 50.0% |
| Creación (400 Bad Request) | 5 | 31.3% |
| Filtrado de Datos | 2 | 12.5% |
| Lógica de Negocio | 1 | 6.2% |

---

## 🎯 Decisiones de Diseño Documentadas

### 1. Visualización de Mapas (Implementado ✅)

**Decisión**: Todos los roles autenticados pueden ver campos y parcelas (GET).

**Justificación**: El frontend necesita renderizar mapas interactivos que muestren todos los campos y parcelas, independientemente del rol del usuario.

**Restricciones**:
- Solo lectura (GET) - permitido para todos
- Creación/modificación (POST/PUT/DELETE) - restringido según rol

### 2. Autorización Cross-Capataz (Pendiente ❌)

**Situación actual**: CAPATAZ puede acceder/modificar work orders de otros CAPATAZ.

**Decisión pendiente**: 
- ¿Debe implementarse aislamiento estricto entre capataces?
- ¿O es correcto el comportamiento actual para colaboración?

### 3. OPERARIO Modificando Actividades PENDING (Pendiente ❌)

**Situación actual**: Test espera que OPERARIO pueda modificar PENDING, pero recibe 403.

**Decisión pendiente**:
- ¿OPERARIO solo puede modificar actividades APPROVED/REJECTED?
- ¿O debería poder modificar PENDING antes de enviar a aprobación?

---

**Última actualización**: 7 de Noviembre, 2025  
**Próxima revisión**: Después de arreglar creaciones (WO-9 a WO-12)
