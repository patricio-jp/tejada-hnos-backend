# Guía Rápida - Testing E2E

## 🚀 Inicio Rápido

### 1. Configurar Base de Datos de Test

**Windows PowerShell:**
```powershell
.\scripts\setup-test-env.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-test-env.sh
./scripts/setup-test-env.sh
```

**Manualmente:**
```sql
-- En PostgreSQL
CREATE DATABASE tejada_hnos_test;
```

### 2. Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo tests E2E
npm run test:e2e

# Tests en modo watch (para desarrollo)
npm run test:watch

# Tests con cobertura
npm run test:coverage
```

## 📋 Lo Que Se Está Probando

### ✅ Flujo de Campos y Parcelas
- Permisos de ADMIN, CAPATAZ y OPERARIO
- CRUD completo de campos
- CRUD completo de parcelas
- Validación de acceso por managerId

### ✅ Flujo de Órdenes de Trabajo y Actividades
- Creación y asignación de órdenes
- Registro de actividades por operarios
- **Aprobación/rechazo de actividades** por capataz/admin
- Validación de acceso por assignedToId
- Workflow completo de aprobación

## 🔑 Puntos Clave

### Roles y Responsabilidades

| Rol | Campos | Órdenes de Trabajo | Actividades |
|-----|--------|-------------------|-------------|
| **ADMIN** | Acceso total | Acceso total | Aprueba/Rechaza |
| **CAPATAZ** | Solo gestionados | Solo de campos gestionados | Aprueba/Rechaza |
| **OPERARIO** | Sin acceso | Solo asignadas | Crea, no aprueba |

### Workflow de Actividades

```
1. OPERARIO crea actividad        → Status: PENDING
2. CAPATAZ/ADMIN revisa            
   ├─ Aprueba                      → Status: APPROVED ✅
   └─ Rechaza                      → Status: REJECTED ❌
3. Si rechazada:
   ├─ OPERARIO corrige             
   └─ CAPATAZ/ADMIN aprueba        → Status: APPROVED ✅
```

## 📊 Resultados Esperados

Al ejecutar `npm test`, deberías ver:

```
PASS  tests/e2e/fields-plots.test.ts
  E2E: Fields and Plots Flow
    ✓ GET /fields - should allow ADMIN to see all fields
    ✓ GET /fields - should allow CAPATAZ to see only managed fields
    ✓ GET /fields - should return empty array for OPERARIO
    ... (más tests)

PASS  tests/e2e/work-orders-activities.test.ts
  E2E: Work Orders and Activities Flow
    ✓ GET /work-orders - should allow ADMIN to see all work orders
    ✓ GET /work-orders - should allow OPERARIO to see only assigned work orders
    ✓ PUT /activities/:id - should allow CAPATAZ to approve pending activity
    ... (más tests)

Test Suites: 2 passed, 2 total
Tests:       XX passed, XX total
```

## 🐛 Troubleshooting

### Error de Conexión a Base de Datos
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución**: Verifica que PostgreSQL esté corriendo:
```bash
# Windows
services.msc  # Buscar PostgreSQL

# Linux
sudo service postgresql status

# Mac
brew services list
```

### Base de Datos No Existe
```
Error: database "tejada_hnos_test" does not exist
```
**Solución**: Ejecuta el script de setup o crea la BD manualmente.

### Tests Fallan por Timeout
**Solución**: La BD de test debe estar en localhost. Si usas una BD remota, aumenta el timeout en `jest.config.js`.

## 📚 Más Información

Para documentación completa, revisa:
- `tests/README.md` - Documentación detallada
- `tests/helpers/` - Código de helpers y fixtures
- `tests/e2e/` - Tests completos con ejemplos

## 🎯 Checklist de Verificación

Antes de hacer commit, asegúrate de que:
- [ ] Todos los tests pasan (`npm test`)
- [ ] No hay errores de TypeScript
- [ ] Los nuevos endpoints tienen tests
- [ ] Los permisos de roles están validados
- [ ] Las validaciones de negocio están probadas

---

**¿Necesitas ayuda?** Revisa la documentación completa en `tests/README.md`
