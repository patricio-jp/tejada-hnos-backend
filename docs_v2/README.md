# 📚 Documentación Completa - Tejada Hnos Backend

**Sistema de Gestión Integral para Producción y Comercialización Agrícola**

Versión: 1.0.0  
Última actualización: Noviembre 2025

---

## 🎯 Propósito del Sistema

Sistema backend para la gestión completa de una empresa agrícola especializada en la producción y comercialización de nueces (walnuts). El sistema integra todo el ciclo de negocio desde la compra de insumos hasta la venta y despacho del producto terminado.

---

## 📖 Índice de Documentación

### 1. Documentos Principales

- **[ARQUITECTURA.md](./ARQUITECTURA.md)** - Visión general del sistema, stack tecnológico y estructura del proyecto
- **[MODELO_DATOS.md](./MODELO_DATOS.md)** - Modelo de datos completo con diagrama ER y descripción de todas las entidades
- **[ROLES_PERMISOS.md](./ROLES_PERMISOS.md)** - Sistema de roles, permisos y autorizaciones

### 2. Diagramas de Flujo

Ubicados en la carpeta `FLUJOS/`:

- **[flujo-general.mmd](./FLUJOS/flujo-general.mmd)** - Flujo general del sistema (vista completa)
- **[flujo-compras.mmd](./FLUJOS/flujo-compras.mmd)** - Flujo detallado del módulo de compras
- **[flujo-produccion.mmd](./FLUJOS/flujo-produccion.mmd)** - Flujo detallado del módulo de producción agrícola
- **[flujo-operaciones.mmd](./FLUJOS/flujo-operaciones.mmd)** - Flujo detallado de órdenes de trabajo y actividades
- **[flujo-ventas.mmd](./FLUJOS/flujo-ventas.mmd)** - Flujo detallado del módulo de ventas (PENDIENTE)
- **[flujo-inventario.mmd](./FLUJOS/flujo-inventario.mmd)** - Flujo de gestión de inventario y stock

### 3. Documentación de Módulos

Ubicados en la carpeta `MODULOS/`:

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| [01-AUTENTICACION.md](./MODULOS/01-AUTENTICACION.md) | ✅ Implementado | Sistema JWT con refresh tokens |
| [02-USUARIOS.md](./MODULOS/02-USUARIOS.md) | ✅ Implementado | Gestión de usuarios y roles |
| [03-COMPRAS.md](./MODULOS/03-COMPRAS.md) | ✅ Implementado | Proveedores, órdenes de compra y recepciones |
| [04-PRODUCCION.md](./MODULOS/04-PRODUCCION.md) | 🔄 En revisión | Campos, parcelas, variedades y lotes de cosecha |
| [05-OPERACIONES.md](./MODULOS/05-OPERACIONES.md) | 🔄 En revisión | Órdenes de trabajo, actividades e insumos |
| [06-VENTAS.md](./MODULOS/06-VENTAS.md) | ⏳ Pendiente | Clientes, órdenes de venta y despachos |
| [07-INVENTARIO.md](./MODULOS/07-INVENTARIO.md) | ⏳ Pendiente | Stock de producto terminado |
| [08-REPORTES.md](./MODULOS/08-REPORTES.md) | 🔮 Futuro | Reportes y analytics |
| [09-TRAZABILIDAD.md](./MODULOS/09-TRAZABILIDAD.md) | 🔮 Futuro | Trazabilidad completa del producto |

**Leyenda:**
- ✅ **Implementado** - Módulo completamente funcional
- 🔄 **En revisión** - Implementado pero sujeto a cambios
- ⏳ **Pendiente** - Planificado pero no implementado
- 🔮 **Futuro** - Planificado para fases posteriores

### 4. Documentación de APIs

Ubicados en la carpeta `API/`:

| Endpoint | Estado | Documentación |
|----------|--------|---------------|
| `/auth/*` | ✅ | [endpoints-auth.md](./API/endpoints-auth.md) |
| `/users/*` | ✅ | [endpoints-usuarios.md](./API/endpoints-usuarios.md) |
| `/suppliers/*` | ✅ | [endpoints-suppliers.md](./API/endpoints-suppliers.md) |
| `/purchase-orders/*` | ✅ | [endpoints-purchase-orders.md](./API/endpoints-purchase-orders.md) |
| `/goods-receipts/*` | ✅ | [endpoints-goods-receipts.md](./API/endpoints-goods-receipts.md) |
| `/fields/*` | 🔄 | [endpoints-fields.md](./API/endpoints-fields.md) |
| `/plots/*` | 🔄 | [endpoints-plots.md](./API/endpoints-plots.md) |
| `/varieties/*` | 🔄 | [endpoints-varieties.md](./API/endpoints-varieties.md) |
| `/harvest-lots/*` | 🔄 | [endpoints-harvest-lots.md](./API/endpoints-harvest-lots.md) |
| `/work-orders/*` | 🔄 | [endpoints-work-orders.md](./API/endpoints-work-orders.md) |
| `/activities/*` | 🔄 | [endpoints-activities.md](./API/endpoints-activities.md) |
| `/inputs/*` | 🔄 | [endpoints-inputs.md](./API/endpoints-inputs.md) |
| `/customers/*` | ⏳ | [endpoints-customers.md](./API/endpoints-customers.md) |
| `/sales-orders/*` | ⏳ | [endpoints-sales-orders.md](./API/endpoints-sales-orders.md) |
| `/shipments/*` | ⏳ | [endpoints-shipments.md](./API/endpoints-shipments.md) |

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

- **Runtime**: Node.js v18+
- **Lenguaje**: TypeScript 5.x
- **Framework Web**: Express 5.x
- **ORM**: TypeORM 0.3.x
- **Base de Datos**: PostgreSQL 12+
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: class-validator + class-transformer
- **Encriptación**: bcrypt

### Estructura de Módulos

```
┌─────────────────────────────────────────────────┐
│              CAPA DE PRESENTACIÓN               │
│         (Routes + Controllers + DTOs)           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              CAPA DE NEGOCIO                    │
│         (Services + Business Logic)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              CAPA DE DATOS                      │
│    (Entities + TypeORM + PostgreSQL)            │
└─────────────────────────────────────────────────┘
```

---

## 🔑 Conceptos Clave del Negocio

### Flujo General del Sistema

```
PROVEEDOR → COMPRA → INSUMOS → CAMPO/PARCELA → ACTIVIDADES → COSECHA → PROCESO → STOCK → VENTA → CLIENTE
```

### Entidades Principales

1. **Users** - Usuarios del sistema (Admin, Capataz, Operario)
2. **Fields** - Campos agrícolas gestionados
3. **Plots** - Parcelas dentro de un campo
4. **Varieties** - Variedades de nueces cultivadas
5. **WorkOrders** - Órdenes de trabajo asignadas
6. **Activities** - Actividades realizadas (con insumos y horas)
7. **HarvestLots** - Lotes de cosecha (trazabilidad)
8. **Suppliers** - Proveedores de insumos
9. **PurchaseOrders** - Órdenes de compra
10. **GoodsReceipts** - Recepciones de mercadería
11. **Customers** - Clientes compradores
12. **SalesOrders** - Órdenes de venta
13. **Shipments** - Despachos de producto

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js v18+
- PostgreSQL 12+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/patricio-jp/tejada-hnos-backend.git
cd tejada-hnos-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

### Crear Usuario Admin Inicial

```bash
npm run seed:admin
```

**Credenciales:**
- Email: `admin@tejadahnos.com`
- Password: `admin123`

⚠️ **Cambiar contraseña después del primer login**

---

## 📋 Convenciones del Proyecto

### Nomenclatura

- **Entidades**: PascalCase (ej: `User`, `PurchaseOrder`)
- **Campos DB**: camelCase (ej: `createdAt`, `totalAmount`)
- **Rutas**: kebab-case (ej: `/purchase-orders`, `/work-orders`)
- **Enums**: UPPER_CASE (ej: `PENDING`, `APPROVED`)

### Timestamps

- Todas las entidades incluyen: `createdAt`, `updatedAt`, `deletedAt`
- Soft delete por defecto (excepto casos específicos)
- Timezone: UTC en base de datos

### Respuestas HTTP

```typescript
// Éxito
{
  "status": 200,
  "data": { ... }
}

// Error
{
  "status": 400,
  "message": "Error descriptivo",
  "errors": [ ... ] // opcional para validaciones
}
```

---

## 🔐 Seguridad

- Autenticación JWT con refresh tokens
- Middleware de autorización por roles
- Autorización a nivel de campo (CAPATAZ solo ve sus campos)
- Passwords hasheados con bcrypt (10 rounds)
- Tokens expiran (access: 3h, refresh: 7d)
- Validación de datos con class-validator

---

## 🧪 Testing

```bash
# Crear datos de prueba
npm run seed:test

# Crear datos específicos de compras
npm run seed:purchase

# Limpiar datos de prueba
npm run seed:clean
```

---

## 📊 Estado del Proyecto

### Completado (✅)

- Sistema de autenticación JWT
- Gestión de usuarios con roles
- CRUD completo de proveedores
- Órdenes de compra con tracking
- Recepciones de mercadería
- CRUD de campos y parcelas
- CRUD de variedades
- Órdenes de trabajo
- Actividades con insumos
- Lotes de cosecha

### En Desarrollo (🔄)

- Refinamiento de módulo de producción
- Ajustes en órdenes de trabajo
- Validaciones adicionales

### Pendiente (⏳)

- Módulo completo de ventas
- Gestión de clientes
- Órdenes de venta
- Despachos/Shipments
- Inventario de stock

### Futuro (🔮)

- Reportes y analytics
- Trazabilidad completa
- Dashboard en tiempo real
- Notificaciones
- Integración con contabilidad

---

## 🤝 Para Desarrolladores

### Antes de Implementar un Módulo

1. Leer la documentación del módulo en `MODULOS/`
2. Revisar el diagrama de flujo en `FLUJOS/`
3. Consultar los endpoints en `API/`
4. Entender el modelo de datos en `MODELO_DATOS.md`
5. Verificar roles y permisos en `ROLES_PERMISOS.md`

### Estructura de un Módulo

Cada módulo debe incluir:

```
src/
├── entities/         # Definición de la entidad TypeORM
├── dtos/             # DTOs para validación
├── services/         # Lógica de negocio
├── controllers/      # Manejo de requests/responses
└── routes/           # Definición de endpoints
```

### Patrón de Servicio

```typescript
class ExampleService {
  constructor(private dataSource: DataSource) {}
  
  async getAll(filters?: any) { ... }
  async getById(id: string) { ... }
  async create(dto: CreateDto) { ... }
  async update(id: string, dto: UpdateDto) { ... }
  async delete(id: string) { ... }
  async restore(id: string) { ... }
  async hardDelete(id: string) { ... }
}
```

---

## 📞 Soporte y Contacto

Para preguntas sobre la implementación, consultar:

1. Esta documentación
2. Los diagramas de flujo en `FLUJOS/`
3. La documentación de cada módulo
4. El código fuente con comentarios

---

## 📝 Notas Importantes

- ⚠️ Este es un sistema en desarrollo activo
- ⚠️ Algunos módulos están sujetos a cambios
- ⚠️ Siempre consultar la documentación actualizada
- ⚠️ Respetar las convenciones establecidas

---

**Última actualización**: Noviembre 2025  
**Mantenido por**: Equipo de Desarrollo Tejada Hnos
