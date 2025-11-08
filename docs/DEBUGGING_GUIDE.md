# Guía de Debugging para Tests E2E

**Fecha**: 7 de Noviembre, 2025

---

## 🐛 Herramientas de Debugging Disponibles

### 1. TestDebugger Helper

**Ubicación**: `tests/helpers/debug.helper.ts`

Este helper proporciona funciones para imprimir el estado de la base de datos en cualquier momento durante un test.

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Ver Estado Completo de la Base de Datos

```typescript
import { TestDebugger } from '../helpers/debug.helper';

describe('My Test Suite', () => {
  it('should do something', async () => {
    // Arrange
    const field = await createTestField(dataSource, { ... });
    const workOrder = await createTestWorkOrder(dataSource, { ... });
    
    // 🐛 DEBUG: Ver todo el estado de la DB
    await TestDebugger.printFullSnapshot(dataSource, 'BEFORE REQUEST');
    
    // Act
    const response = await request(app)
      .get(`/work-orders/${workOrder.id}`)
      .set('Authorization', `Bearer ${token}`);
    
    // 🐛 DEBUG: Ver estado después de la petición
    await TestDebugger.printFullSnapshot(dataSource, 'AFTER REQUEST');
    
    // Assert
    expect(response.status).toBe(200);
  });
});
```

**Salida**:
```
======================================================================
  BEFORE REQUEST
======================================================================

========== USERS (5) ==========
- Admin User (ADMIN) [ID: abc-123...]
  Email: admin@test.com
- Capataz A (CAPATAZ) [ID: def-456...]
  Email: capataz@test.com
  Managed Fields: field-1, field-2
...
==================================================

========== FIELDS (3) ==========
- Campo Norte [ID: field-1]
  Area: 100 hectáreas
  Manager: Capataz A
  Address: Dirección 123
...
```

---

### Ejemplo 2: Ver Solo Work Orders

```typescript
import { TestDebugger } from '../helpers/debug.helper';

it('should deny CAPATAZ access to work order from unmanaged field', async () => {
  const scenario = await setupWorkOrderScenario(dataSource, {
    capatazId: capataz.id,
    operarioId: operario.id,
  });

  // 🐛 DEBUG: Ver todos los work orders y a quién están asignados
  await TestDebugger.printWorkOrders(dataSource, 'WORK ORDERS IN DB');
  
  // 🐛 DEBUG: Ver permisos del capataz
  await TestDebugger.printUserPermissions(dataSource, capataz.id, 'CAPATAZ_A');

  const response = await request(app)
    .get(`/work-orders/${scenario.unassignedWorkOrder.id}`)
    .set('Authorization', `Bearer ${capataz.token}`);

  console.log('Response status:', response.status); // 🐛 Simple log
  console.log('Response body:', JSON.stringify(response.body, null, 2)); // 🐛 Ver respuesta

  expect(response.status).toBe(403);
});
```

---

### Ejemplo 3: Debugging de Creación con 400 Bad Request

```typescript
it('should allow ADMIN to create a work order', async () => {
  const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

  // 🐛 DEBUG: Ver plots disponibles
  await TestDebugger.printPlots(dataSource, 'AVAILABLE PLOTS');

  const workOrderData = {
    title: 'New Work Order',
    description: 'Test work order',
    scheduledDate: new Date('2025-07-01').toISOString(),
    dueDate: new Date('2025-07-15').toISOString(),
    assignedToUserId: operario.id,
    plotIds: [scenario.managedPlot.id],
  };

  // 🐛 DEBUG: Ver datos que se envían
  console.log('📤 Request Data:', JSON.stringify(workOrderData, null, 2));

  const response = await request(app)
    .post('/work-orders')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(workOrderData);

  // 🐛 DEBUG: Ver respuesta completa
  console.log('📥 Response Status:', response.status);
  console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));

  // Si falló, ver por qué
  if (response.status === 400) {
    console.log('❌ VALIDATION ERROR:', response.body.message);
    console.log('❌ Errors:', response.body.errors);
  }

  expect(response.status).toBe(201);
});
```

---

### Ejemplo 4: Ver Solo Conteo de Registros

```typescript
it('should clear database correctly', async () => {
  // 🐛 DEBUG: Ver conteo antes de limpiar
  await TestDebugger.printRecordCounts(dataSource);
  
  await clearDatabase(dataSource);
  
  // 🐛 DEBUG: Ver conteo después de limpiar
  await TestDebugger.printRecordCounts(dataSource);
  
  // Verificar que todo esté limpio
  const userCount = await dataSource.getRepository(User).count();
  expect(userCount).toBe(0);
});
```

---

### Ejemplo 5: Debugging de Autorización Cross-Capataz

```typescript
it('should deny CAPATAZ_B access to CAPATAZ_A managed field work order', async () => {
  // Crear field para Capataz A
  const fieldA = await createTestField(dataSource, {
    name: 'Campo A1',
    area: 100,
    managerId: capataz.id, // ← CAPATAZ_A
    // ...
  });

  const plotA = await createTestPlot(dataSource, {
    name: 'Parcela A1',
    fieldId: fieldA.id,
    area: 50,
  });

  const workOrderA = await createTestWorkOrder(dataSource, {
    title: 'WO de Capataz A',
    assignedToId: operario.id,
    plotIds: [plotA.id],
    // ...
  });

  // 🐛 DEBUG: Ver permisos de ambos capataces
  console.log('\n🔍 DEBUGGING AUTORIZACIÓN CROSS-CAPATAZ\n');
  await TestDebugger.printUserPermissions(dataSource, capataz.id, 'CAPATAZ_A');
  await TestDebugger.printUserPermissions(dataSource, capatazB.id, 'CAPATAZ_B');
  
  // 🐛 DEBUG: Ver el work order y sus plots
  await TestDebugger.printWorkOrders(dataSource, 'WORK ORDER TO ACCESS');

  // CAPATAZ_B intenta acceder al work order de CAPATAZ_A
  const response = await request(app)
    .get(`/work-orders/${workOrderA.id}`)
    .set('Authorization', `Bearer ${capatazB.token}`); // ← CAPATAZ_B

  console.log('📥 Response:', response.status, response.body);

  expect(response.status).toBe(403); // Debería ser denegado
});
```

---

## 🔧 Métodos Disponibles en TestDebugger

### Métodos Individuales

| Método | Descripción | Uso |
|--------|-------------|-----|
| `printUsers(dataSource, label?)` | Imprime todos los usuarios | Ver roles y permisos |
| `printFields(dataSource, label?)` | Imprime todos los fields | Ver managers asignados |
| `printPlots(dataSource, label?)` | Imprime todos los plots | Ver relaciones con fields |
| `printWorkOrders(dataSource, label?)` | Imprime todos los work orders | Ver asignaciones |
| `printActivities(dataSource, label?)` | Imprime todas las activities | Ver estados y relaciones |
| `printFullSnapshot(dataSource, label?)` | Imprime TODO | Snapshot completo de la DB |
| `printUserPermissions(dataSource, userId, userName)` | Imprime permisos de un usuario | Debugging de autorización |
| `printRecordCounts(dataSource)` | Conteo de registros por entidad | Verificar limpieza de DB |

---

## 🎯 Debugging con VS Code

### Opción 1: Ejecutar Test Individual con Node Inspector

1. **Configuración de VS Code** (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Current Test File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "${file}",
        "--runInBand",
        "--no-cache",
        "--detectOpenHandles"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Debug Single Test",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--no-cache",
        "-t",
        "should deny CAPATAZ access to work order from unmanaged field"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "windows": {
        "program": "${workspaceFolder}/node_modules/jest/bin/jest"
      }
    }
  ]
}
```

2. **Uso**:
   - Coloca un **breakpoint** en tu test (click en el margen izquierdo)
   - Presiona `F5` o ve a "Run and Debug"
   - Selecciona "Jest: Current Test File"
   - El test se detendrá en tu breakpoint

---

### Opción 2: Ejecutar Test Individual desde Terminal

```bash
# Ejecutar UN test específico con logs
npm test -- -t "should deny CAPATAZ access to work order from unmanaged field"

# Con más detalles
npm test -- -t "should deny CAPATAZ" --verbose

# Solo un archivo
npm test -- tests/e2e/work-orders-activities.test.ts
```

---

## 🔍 Debugging de Errores Comunes

### Error 400 Bad Request

```typescript
it('should create work order', async () => {
  const workOrderData = { /* ... */ };
  
  // 🐛 Ver datos antes de enviar
  console.log('📤 Sending:', JSON.stringify(workOrderData, null, 2));
  
  const response = await request(app)
    .post('/work-orders')
    .set('Authorization', `Bearer ${token}`)
    .send(workOrderData);
  
  // 🐛 Ver respuesta completa
  if (response.status !== 201) {
    console.log('❌ Status:', response.status);
    console.log('❌ Body:', JSON.stringify(response.body, null, 2));
    
    // Ver validación específica
    if (response.body.errors) {
      console.log('❌ Validation Errors:');
      response.body.errors.forEach((err: any) => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    }
  }
  
  expect(response.status).toBe(201);
});
```

---

### Error 403 Forbidden (Debugging de Autorización)

```typescript
it('should test authorization', async () => {
  // 🐛 Ver estado del usuario y sus permisos
  await TestDebugger.printUserPermissions(dataSource, capataz.id, 'CAPATAZ');
  
  // 🐛 Ver el recurso al que intenta acceder
  const workOrder = await dataSource.getRepository(WorkOrder).findOne({
    where: { id: workOrderId },
    relations: ['plots', 'plots.field', 'plots.field.manager']
  });
  
  console.log('🔍 Work Order:', workOrder?.title);
  console.log('🔍 Plots:', workOrder?.plots?.length);
  workOrder?.plots?.forEach(plot => {
    console.log(`  - Plot: ${plot.name}, Field: ${plot.field.name}, Manager: ${plot.field.manager?.name}`);
  });
  
  const response = await request(app)
    .get(`/work-orders/${workOrderId}`)
    .set('Authorization', `Bearer ${capataz.token}`);
  
  console.log('📥 Response:', response.status);
  
  expect(response.status).toBe(403);
});
```

---

## 💡 Tips de Debugging

### 1. **Usar `.only` para ejecutar un solo test**

```typescript
it.only('should test this one', async () => {
  // Solo este test se ejecutará
});
```

### 2. **Usar `.skip` para saltar tests**

```typescript
it.skip('should test this later', async () => {
  // Este test será saltado
});
```

### 3. **Aumentar timeout para debugging**

```typescript
it('should test with more time', async () => {
  // ...
}, 60000); // 60 segundos
```

### 4. **Ver queries SQL ejecutadas**

En `src/config/typeorm.config.ts`:

```typescript
export const getDataSource = (env: 'development' | 'test' | 'production') => {
  return new DataSource({
    // ...
    logging: env === 'test' ? true : false, // ← Activar logging
    logger: 'advanced-console',
  });
};
```

### 5. **Debugging con debugger statement**

```typescript
it('should debug here', async () => {
  const response = await request(app).get('/work-orders');
  
  debugger; // ← Pause aquí cuando se ejecute con debugger
  
  expect(response.status).toBe(200);
});
```

---

## 📋 Checklist de Debugging

Cuando un test falla, sigue estos pasos:

- [ ] **Ver el error exacto**: `console.log(response.status, response.body)`
- [ ] **Ver datos en la DB**: `await TestDebugger.printFullSnapshot(dataSource)`
- [ ] **Ver permisos del usuario**: `await TestDebugger.printUserPermissions(...)`
- [ ] **Ver datos enviados**: `console.log('Request:', requestData)`
- [ ] **Ejecutar test individual**: `npm test -- -t "nombre del test"`
- [ ] **Usar breakpoints**: Configurar VS Code debugger
- [ ] **Ver logs del servidor**: Activar logging en TypeORM
- [ ] **Revisar fixtures**: Verificar que los datos de test sean correctos

---

## 🎯 Ejemplo Completo de Test con Debugging

```typescript
import { TestDebugger } from '../helpers/debug.helper';

describe('Debugging Example', () => {
  it('should debug work order creation', async () => {
    console.log('\n🔍 ===== START DEBUGGING =====\n');
    
    // Step 1: Ver estado inicial
    await TestDebugger.printRecordCounts(dataSource);
    
    // Step 2: Crear datos de test
    const field = await createTestField(dataSource, {
      name: 'Test Field',
      managerId: capataz.id,
      area: 100,
    });
    
    const plot = await createTestPlot(dataSource, {
      name: 'Test Plot',
      fieldId: field.id,
      area: 50,
    });
    
    // Step 3: Ver datos creados
    await TestDebugger.printFields(dataSource, 'FIELDS AFTER CREATION');
    await TestDebugger.printPlots(dataSource, 'PLOTS AFTER CREATION');
    
    // Step 4: Preparar request
    const workOrderData = {
      title: 'Test Work Order',
      description: 'Testing',
      scheduledDate: new Date('2025-07-01').toISOString(),
      dueDate: new Date('2025-07-15').toISOString(),
      assignedToUserId: operario.id,
      plotIds: [plot.id],
    };
    
    console.log('📤 Request Data:', JSON.stringify(workOrderData, null, 2));
    
    // Step 5: Ejecutar request
    const response = await request(app)
      .post('/work-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send(workOrderData);
    
    // Step 6: Analizar respuesta
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.status === 400) {
      console.log('❌ VALIDATION ERROR DETAILS:');
      console.log('Message:', response.body.message);
      console.log('Errors:', response.body.errors);
    }
    
    // Step 7: Ver estado final
    await TestDebugger.printWorkOrders(dataSource, 'WORK ORDERS AFTER CREATION');
    
    console.log('\n🔍 ===== END DEBUGGING =====\n');
    
    expect(response.status).toBe(201);
  });
});
```

---

**Última actualización**: 7 de Noviembre, 2025  
**Herramientas**: Jest + TypeORM + TestDebugger Helper
