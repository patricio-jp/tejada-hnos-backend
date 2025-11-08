# Testing E2E - Tejada Hnos Backend

## Descripción General

Este proyecto cuenta con tests E2E (End-to-End) completos para validar los flujos de trabajo principales del sistema, incluyendo:

1. **Flujo de Campos y Parcelas**: Gestión de campos agrícolas y sus parcelas
2. **Flujo de Órdenes de Trabajo y Actividades**: Creación, asignación y aprobación de órdenes de trabajo y actividades

## Configuración

### Base de Datos de Test

Los tests utilizan una base de datos PostgreSQL separada de desarrollo. La configuración se encuentra en el archivo `.env.test`:

```env
POSTGRES_DATABASE=tejada_hnos_test
```

**IMPORTANTE**: Antes de ejecutar los tests, asegúrate de crear la base de datos de test:

```sql
CREATE DATABASE tejada_hnos_test;
```

### Variables de Entorno

El archivo `.env.test` contiene la configuración específica para testing:
- Puerto diferente al de desarrollo (3001)
- Base de datos de test (`tejada_hnos_test`)
- Secrets JWT específicos para testing

## Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Solo tests E2E
```bash
npm run test:e2e
```

### Tests en modo watch (desarrollo)
```bash
npm run test:watch
```

### Tests con cobertura
```bash
npm run test:coverage
```

## Estructura de Tests

```
tests/
├── setup.ts                          # Configuración global de Jest
├── helpers/                          # Utilidades para testing
│   ├── database.helper.ts            # Manejo de base de datos de test
│   ├── auth.helper.ts                # Creación de usuarios y tokens JWT
│   ├── fixtures.helper.ts            # Creación de datos de prueba
│   └── app.helper.ts                 # Inicialización de la aplicación Express
└── e2e/                              # Tests End-to-End
    ├── fields-plots.test.ts          # Tests de campos y parcelas
    └── work-orders-activities.test.ts # Tests de órdenes de trabajo y actividades
```

## Flujos de Trabajo Testeados

### 1. Flujo de Campos y Parcelas

#### Roles y Permisos Probados:

**ADMIN (Acceso Total)**
- ✅ Ver todos los campos
- ✅ Ver cualquier campo por ID
- ✅ Crear nuevos campos
- ✅ Actualizar cualquier campo
- ✅ Eliminar (soft delete) cualquier campo
- ✅ Restaurar campos eliminados
- ✅ Crear parcelas en cualquier campo
- ✅ Ver parcelas de cualquier campo

**CAPATAZ (Acceso a Campos Gestionados)**
- ✅ Ver solo campos que gestiona (managerId)
- ✅ Ver detalles de campos que gestiona
- ❌ No puede ver campos que no gestiona
- ❌ No puede crear campos
- ❌ No puede actualizar campos
- ❌ No puede eliminar campos
- ❌ No puede crear parcelas
- ✅ Ver parcelas de campos que gestiona
- ❌ No puede ver parcelas de campos no gestionados

**OPERARIO (Sin Acceso a Campos)**
- ✅ Retorna lista vacía al listar campos
- ❌ No puede ver detalles de campos
- ❌ No puede crear campos
- ❌ No puede actualizar campos
- ❌ No puede eliminar campos
- ❌ No puede crear parcelas
- ❌ No puede ver parcelas

#### Tests de Workflow Completo:
- ✅ Crear campo → Crear parcela → Obtener detalles → Actualizar → Eliminar → Restaurar

### 2. Flujo de Órdenes de Trabajo y Actividades

#### Roles y Permisos Probados:

**ADMIN (Acceso Total)**
- ✅ Ver todas las órdenes de trabajo
- ✅ Ver cualquier orden por ID
- ✅ Crear órdenes de trabajo
- ✅ Actualizar cualquier orden
- ✅ Eliminar cualquier orden
- ✅ Crear actividades en cualquier orden
- ✅ Ver todas las actividades
- ✅ Aprobar/rechazar actividades
- ✅ Eliminar actividades

**CAPATAZ (Acceso a Campos Gestionados)**
- ✅ Ver órdenes de trabajo relacionadas a sus campos
- ✅ Ver detalles de órdenes en sus campos
- ❌ No puede ver órdenes de campos no gestionados
- ✅ Crear órdenes para campos que gestiona
- ❌ No puede crear órdenes para campos no gestionados
- ✅ Actualizar órdenes de sus campos
- ❌ No puede actualizar órdenes de otros campos
- ✅ Eliminar órdenes de sus campos
- ❌ No puede eliminar órdenes de otros campos
- ✅ Crear actividades en órdenes de sus campos
- ✅ Ver actividades de sus campos
- ✅ **Aprobar actividades** de órdenes en sus campos
- ✅ **Rechazar actividades** de órdenes en sus campos
- ✅ Eliminar actividades de sus campos

**OPERARIO (Solo Órdenes Asignadas)**
- ✅ Ver solo órdenes asignadas a él (assignedToId)
- ✅ Ver detalles de órdenes asignadas
- ❌ No puede ver órdenes no asignadas
- ❌ No puede crear órdenes
- ❌ No puede actualizar órdenes
- ❌ No puede eliminar órdenes
- ✅ **Crear actividades** en órdenes asignadas
- ❌ No puede crear actividades en órdenes no asignadas
- ✅ Ver actividades de órdenes asignadas
- ✅ Actualizar sus propias actividades (PENDING)
- ❌ **NO puede aprobar** sus propias actividades
- ❌ No puede actualizar actividades de otros operarios
- ❌ No puede eliminar actividades

#### Workflow de Aprobación de Actividades:

**Flujo Exitoso:**
1. OPERARIO crea actividad → Estado: `PENDING`
2. OPERARIO puede actualizar horas/detalles → Estado: `PENDING`
3. CAPATAZ/ADMIN aprueba → Estado: `APPROVED`
4. Actividad aprobada registrada en sistema

**Flujo de Rechazo:**
1. OPERARIO crea actividad → Estado: `PENDING`
2. CAPATAZ/ADMIN rechaza → Estado: `REJECTED`
3. OPERARIO actualiza y corrige → Estado: `REJECTED` (puede actualizar datos)
4. CAPATAZ/ADMIN aprueba → Estado: `APPROVED`

#### Tests de Workflow Completo:
- ✅ ADMIN crea orden → OPERARIO crea actividad → CAPATAZ aprueba → ADMIN marca como completada
- ✅ OPERARIO crea actividad → CAPATAZ rechaza → OPERARIO corrige → CAPATAZ aprueba

## Validaciones Clave

### Autenticación y Autorización
- ✅ Todos los endpoints requieren autenticación
- ✅ Tokens JWT válidos y expiración
- ✅ Control de acceso por roles
- ✅ Validación de propiedad de recursos

### Integridad de Datos
- ✅ Soft deletes funcionando correctamente
- ✅ Relaciones entre entidades mantenidas
- ✅ Cascadas y eliminaciones
- ✅ Validación de datos en DTOs

### Flujos de Negocio
- ✅ CAPATAZ solo accede a campos que gestiona
- ✅ OPERARIO solo accede a órdenes asignadas
- ✅ Solo CAPATAZ/ADMIN aprueban actividades
- ✅ OPERARIO no puede auto-aprobar actividades

## Datos de Prueba

### Usuarios Estándar Creados en Cada Test:

| Rol | Email | Password | Hourly Rate |
|-----|-------|----------|-------------|
| ADMIN | admin@test.com | admin123 | $50 |
| CAPATAZ | capataz@test.com | capataz123 | $30 |
| OPERARIO | operario@test.com | operario123 | $20 |

### Fixtures Disponibles:

- `createStandardTestUsers()`: Crea los 3 usuarios estándar
- `createTestField()`: Crea un campo
- `createTestPlot()`: Crea una parcela
- `createTestWorkOrder()`: Crea una orden de trabajo
- `createTestActivity()`: Crea una actividad
- `setupFieldPlotScenario()`: Escenario completo con campos y parcelas
- `setupWorkOrderScenario()`: Escenario completo con órdenes y actividades

## Limpieza de Base de Datos

Antes de cada test, la base de datos se limpia automáticamente usando `clearDatabase()`:
- Desactiva restricciones de claves foráneas
- Trunca todas las tablas
- Reinicia secuencias de IDs
- Reactiva restricciones

Esto asegura que cada test ejecute en un estado limpio y predecible.

## Verificación en Base de Datos

Los tests verifican los cambios directamente en la base de datos PostgreSQL:

```typescript
// Ejemplo: Verificar soft delete
const fieldRepository = dataSource.getRepository(Field);
const deletedField = await fieldRepository.findOne({
  where: { id: field.id },
  withDeleted: true, // Incluye registros soft-deleted
});
expect(deletedField!.deletedAt).toBeTruthy();
```

## Errores Comunes y Soluciones

### Error: "Cannot connect to database"
**Solución**: Asegúrate de que PostgreSQL está corriendo y la base de datos `tejada_hnos_test` existe.

```bash
# En PostgreSQL
CREATE DATABASE tejada_hnos_test;
```

### Error: "Module not found @/..."
**Solución**: Los paths alias están configurados en `jest.config.js`. Si ves este error, verifica que `moduleNameMapper` esté correctamente configurado.

### Tests fallan por timeout
**Solución**: El timeout está configurado en 30 segundos. Si los tests son lentos, puede ser por:
- Base de datos remota (usa localhost)
- Muchos datos en base de datos (se limpia antes de cada test)
- Sistema sobrecargado

### Tests fallan aleatoriamente
**Solución**: Verifica que `clearDatabase()` se ejecute en `beforeEach`. Cada test debe ser independiente.

## Mejores Prácticas

1. **Independencia**: Cada test debe poder ejecutarse solo
2. **Limpieza**: La base de datos se limpia antes de cada test
3. **AAA Pattern**: Arrange → Act → Assert
4. **Nombres descriptivos**: Los nombres de tests explican QUÉ se prueba
5. **Verificación en DB**: Los cambios críticos se verifican en la base de datos
6. **Scenarios**: Usa helpers para crear escenarios complejos reutilizables

## Agregar Nuevos Tests

Para agregar nuevos tests:

1. Crea un nuevo archivo en `tests/e2e/nombre.test.ts`
2. Importa los helpers necesarios
3. Sigue el patrón existente:

```typescript
import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers } from '../helpers/auth.helper';

describe('E2E: Mi Nuevo Flujo', () => {
  let app: Express;
  let dataSource: DataSource;
  let admin, capataz, operario;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = createTestApp(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
    const users = await createStandardTestUsers(dataSource);
    admin = users.admin;
    capataz = users.capataz;
    operario = users.operario;
  });

  it('should...', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Cobertura de Tests

Los tests cubren:
- ✅ Autenticación y autorización
- ✅ CRUD completo de entidades
- ✅ Permisos por roles
- ✅ Flujos de negocio complejos
- ✅ Validación de datos
- ✅ Relaciones entre entidades
- ✅ Soft deletes y restauración
- ✅ Workflows de aprobación

## Notas Importantes

1. **Base de Datos Real**: Los tests usan PostgreSQL real, no SQLite. Esto asegura compatibilidad exacta con producción.

2. **Transacciones**: Cada test es independiente. La base de datos se limpia entre tests.

3. **Tokens JWT**: Se generan tokens reales para cada usuario en cada test.

4. **Fechas UTC**: Todas las fechas se manejan en UTC.

5. **Validaciones**: Los DTOs se validan automáticamente en los endpoints.

## Contribuir

Al agregar nuevas funcionalidades:
1. Escribe tests E2E para los nuevos endpoints
2. Verifica permisos de los 3 roles
3. Valida en base de datos los cambios críticos
4. Documenta los nuevos flujos en este README

---

**Última actualización**: Noviembre 2025
