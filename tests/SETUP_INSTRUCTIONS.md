# ⚠️ IMPORTANTE: Configuración Inicial de Tests

## Antes de Ejecutar los Tests

### 1. Crear Base de Datos de Test

Los tests requieren una base de datos PostgreSQL separada llamada `tejada_hnos_test`.

**Opción A: Usando pgAdmin o cualquier cliente PostgreSQL**
1. Abre tu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
2. Conéctate a tu servidor local
3. Crea una nueva base de datos llamada `tejada_hnos_test`

**Opción B: Usando psql (línea de comandos)**
```bash
# Asegúrate de que psql esté en tu PATH
psql -U postgres -c "CREATE DATABASE tejada_hnos_test;"
```

**Opción C: Usando SQL directamente**
```sql
CREATE DATABASE tejada_hnos_test;
```

### 2. Verificar Configuración

Asegúrate de que tu archivo `.env.test` tiene la configuración correcta:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=         # Tu password de PostgreSQL
POSTGRES_DATABASE=tejada_hnos_test
```

### 3. Ejecutar Tests

Una vez que la base de datos esté creada:

```bash
npm test
```

## Estructura Creada

```
tests/
├── README.md                     # Documentación completa
├── QUICK_START.md                # Guía rápida
├── setup.ts                      # Configuración global
├── helpers/
│   ├── database.helper.ts        # Manejo de BD
│   ├── auth.helper.ts            # Autenticación
│   ├── fixtures.helper.ts        # Datos de prueba
│   └── app.helper.ts             # App Express
└── e2e/
    ├── fields-plots.test.ts      # 40+ tests de campos/parcelas
    └── work-orders-activities.test.ts  # 50+ tests de órdenes/actividades
```

## Lo Que Cubren los Tests

### ✅ Flujo 1: Campos y Parcelas (40+ tests)
- Permisos de ADMIN: acceso total
- Permisos de CAPATAZ: solo campos gestionados
- Permisos de OPERARIO: sin acceso
- CRUD completo validado para cada rol
- Workflow completo de creación a eliminación

### ✅ Flujo 2: Órdenes de Trabajo y Actividades (50+ tests)
- Permisos de ADMIN: acceso total
- Permisos de CAPATAZ: solo campos gestionados, puede aprobar
- Permisos de OPERARIO: solo órdenes asignadas, puede crear actividades
- **Workflow de aprobación de actividades**:
  - OPERARIO crea → PENDING
  - CAPATAZ/ADMIN aprueba → APPROVED
  - CAPATAZ/ADMIN rechaza → REJECTED
  - OPERARIO corrige → CAPATAZ/ADMIN aprueba
- Validación completa de autorizaciones

## Verificación Exitosa

Si todo está configurado correctamente, verás algo como:

```
PASS  tests/e2e/fields-plots.test.ts (XX.XXs)
PASS  tests/e2e/work-orders-activities.test.ts (XX.XXs)

Test Suites: 2 passed, 2 total
Tests:       90+ passed, 90+ total
Snapshots:   0 total
Time:        XX.XXs
```

## Comandos Disponibles

```bash
npm test              # Ejecutar todos los tests
npm run test:e2e      # Solo tests E2E
npm run test:watch    # Modo watch (desarrollo)
npm run test:coverage # Con reporte de cobertura
```

## Próximos Pasos

1. ✅ Crea la base de datos `tejada_hnos_test`
2. ✅ Verifica el archivo `.env.test`
3. ✅ Ejecuta `npm test`
4. ✅ Revisa `tests/README.md` para documentación completa
5. ✅ Revisa `tests/QUICK_START.md` para guía rápida

## Características Técnicas

- ✅ **PostgreSQL Real**: No SQLite, pruebas exactas a producción
- ✅ **Limpieza Automática**: BD se limpia antes de cada test
- ✅ **Tokens JWT Reales**: Autenticación completa
- ✅ **Validación en BD**: Cambios verificados directamente en PostgreSQL
- ✅ **Fixtures Reutilizables**: Helpers para crear datos de prueba
- ✅ **Cobertura Completa**: Permisos, validaciones, workflows

---

**¿Dudas?** Revisa la documentación completa en `tests/README.md`
