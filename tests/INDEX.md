# 📚 Índice de Documentación de Testing

## Documentos Disponibles

### 🚀 Para Empezar
1. **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - ⭐ **EMPIEZA AQUÍ**
   - Configuración inicial paso a paso
   - Creación de base de datos
   - Verificación de entorno
   - Primeros pasos

2. **[QUICK_START.md](QUICK_START.md)** - Guía Rápida
   - Comandos esenciales
   - Troubleshooting común
   - Checklist de verificación

### 📖 Documentación Completa
3. **[README.md](README.md)** - Documentación Técnica Detallada
   - Arquitectura de tests
   - Explicación de cada helper
   - Todos los flujos testeados
   - Mejores prácticas
   - Cobertura completa

### 📊 Resumen Ejecutivo
4. **[../docs/TESTING_E2E_SUMMARY.md](../docs/TESTING_E2E_SUMMARY.md)** - Resumen de Implementación
   - Overview de lo implementado
   - Tablas de permisos
   - Estadísticas de tests
   - Beneficios del sistema

## Estructura de Archivos

```
tests/
├── README.md                     # Documentación técnica completa
├── QUICK_START.md                # Guía rápida de inicio
├── SETUP_INSTRUCTIONS.md         # ⭐ Configuración inicial
├── INDEX.md                      # Este archivo
├── setup.ts                      # Configuración global de Jest
│
├── helpers/                      # Utilidades de testing
│   ├── database.helper.ts        # Conexión y limpieza de BD
│   ├── auth.helper.ts            # Usuarios y tokens JWT
│   ├── fixtures.helper.ts        # Datos de prueba
│   └── app.helper.ts             # App Express para tests
│
└── e2e/                          # Tests End-to-End
    ├── fields-plots.test.ts      # 40+ tests de Campos/Parcelas
    └── work-orders-activities.test.ts  # 50+ tests de Órdenes/Actividades

docs/
└── TESTING_E2E_SUMMARY.md        # Resumen ejecutivo

scripts/
├── setup-test-env.sh             # Setup automático (Linux/Mac)
└── setup-test-env.ps1            # Setup automático (Windows)
```

## Flujo de Lectura Recomendado

### Para Configurar el Entorno
1. Lee **SETUP_INSTRUCTIONS.md**
2. Crea la base de datos
3. Ejecuta `npm test`
4. Si hay errores, consulta **QUICK_START.md** (sección Troubleshooting)

### Para Entender el Sistema
1. Lee **TESTING_E2E_SUMMARY.md** (resumen ejecutivo)
2. Lee **README.md** (documentación técnica)
3. Revisa los archivos de test para ver ejemplos

### Para Desarrollar Nuevos Tests
1. Lee **README.md** (sección "Agregar Nuevos Tests")
2. Revisa los helpers en `helpers/`
3. Usa los tests existentes como plantilla
4. Sigue el patrón AAA (Arrange-Act-Assert)

## Comandos Rápidos

```bash
# Configuración inicial
CREATE DATABASE tejada_hnos_test;  # En PostgreSQL

# Ejecutar tests
npm test                    # Todos los tests
npm run test:e2e           # Solo E2E
npm run test:watch         # Modo watch
npm run test:coverage      # Con cobertura

# Scripts de ayuda
./scripts/setup-test-env.sh    # Linux/Mac
.\scripts\setup-test-env.ps1   # Windows
```

## Tests Implementados

### ✅ Flujo 1: Campos y Parcelas (40+ tests)
- Permisos de ADMIN, CAPATAZ, OPERARIO
- CRUD completo
- Validación de managerId
- Workflow completo

### ✅ Flujo 2: Órdenes de Trabajo y Actividades (50+ tests)
- Permisos de ADMIN, CAPATAZ, OPERARIO
- CRUD completo de órdenes
- Creación y gestión de actividades
- **Workflow de aprobación completo**
- Validación de assignedToId

## Tecnologías Utilizadas

- **Jest**: Framework de testing
- **Supertest**: HTTP assertions
- **TypeScript**: Tipado estático
- **PostgreSQL**: Base de datos real
- **JWT**: Autenticación real

## Soporte

### Problemas Comunes
Consulta **QUICK_START.md** → Sección Troubleshooting

### Documentación Técnica
Consulta **README.md** → Documentación completa

### Configuración
Consulta **SETUP_INSTRUCTIONS.md** → Paso a paso

---

**💡 Tip**: Empieza por **SETUP_INSTRUCTIONS.md** si es tu primera vez
