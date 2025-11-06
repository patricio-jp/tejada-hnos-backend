# 🏗️ Arquitectura del Sistema

## Índice
- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura de Capas](#arquitectura-de-capas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Patrones de Diseño](#patrones-de-diseño)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Gestión de Errores](#gestión-de-errores)
- [Configuración](#configuración)

---

## Visión General

**Tejada Hnos Backend** es una API REST construida con Node.js y TypeScript que sigue una arquitectura por capas limpia y escalable. El sistema está diseñado para gestionar todo el ciclo de vida de una empresa agrícola, desde la compra de insumos hasta la venta del producto terminado.

### Características Principales

- ✅ **API RESTful** con arquitectura por capas
- ✅ **TypeScript** para type safety
- ✅ **TypeORM** para manejo de base de datos
- ✅ **JWT** para autenticación y autorización
- ✅ **Validación automática** de DTOs
- ✅ **Soft Delete** por defecto
- ✅ **Timestamps automáticos** en todas las entidades
- ✅ **Manejo centralizado de errores**

---

## Stack Tecnológico

### Core

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime de JavaScript |
| **TypeScript** | 5.x | Lenguaje tipado |
| **Express** | 5.1.x | Framework web |
| **TypeORM** | 0.3.27 | ORM para PostgreSQL |
| **PostgreSQL** | 12+ | Base de datos relacional |

### Seguridad

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **jsonwebtoken** | 9.0.2 | Autenticación JWT |
| **bcrypt** | 6.0.0 | Hash de contraseñas |
| **cors** | 2.8.5 | CORS middleware |

### Validación

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **class-validator** | 0.14.2 | Validación de DTOs |
| **class-transformer** | 0.5.1 | Transformación de objetos |

### Utilidades

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **dotenv** | 17.2.3 | Variables de entorno |
| **http-status-codes** | 2.3.0 | Códigos HTTP estandarizados |
| **reflect-metadata** | 0.2.2 | Decoradores TypeScript |
| **module-alias** | 2.2.3 | Alias de paths (@controllers, @services, etc.) |

### Desarrollo

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **nodemon** | - | Hot reload en desarrollo |
| **ts-node** | - | Ejecutar TypeScript directamente |
| **tsconfig-paths** | - | Resolver alias de TypeScript |

---

## Arquitectura de Capas

El sistema sigue una **arquitectura en capas** clara y desacoplada:

```
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE CLIENTE                       │
│              (Frontend / API Consumers)                 │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                  CAPA DE PRESENTACIÓN                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Routes  │→ │ Middlewares  │→ │ Controllers  │     │
│  └──────────┘  └──────────────┘  └──────────────┘     │
│     ↓               ↓                    ↓              │
│  Routing      Auth/Validation        HTTP I/O          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     CAPA DE VALIDACIÓN                  │
│  ┌──────────┐  ┌──────────────┐                        │
│  │   DTOs   │→ │ Validators   │                        │
│  └──────────┘  └──────────────┘                        │
│  Definición      class-validator                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE NEGOCIO                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Services │→ │ Business Logic│→ │   Helpers    │     │
│  └──────────┘  └──────────────┘  └──────────────┘     │
│  Lógica del negocio, reglas, cálculos                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Entities │→ │   TypeORM    │→ │  PostgreSQL  │     │
│  └──────────┘  └──────────────┘  └──────────────┘     │
│  Modelos         ORM              Base de datos         │
└─────────────────────────────────────────────────────────┘
```

### 1. Capa de Presentación (Routes + Middlewares + Controllers)

**Responsabilidades:**
- Definir endpoints y rutas
- Autenticación y autorización
- Validación de datos de entrada
- Manejo de requests/responses HTTP
- Transformación de datos para la respuesta

**Componentes:**

```typescript
// Routes: Definición de endpoints
router.post('/purchase-orders', 
  authenticate,                          // Middleware: Autenticación
  authorize(UserRole.ADMIN),             // Middleware: Autorización
  validateData(CreatePurchaseOrderDto),  // Middleware: Validación
  controller.create                      // Controller: Manejo HTTP
);

// Controller: Orquesta la lógica
class PurchaseOrderController {
  async create(req: Request, res: Response) {
    const dto = req.body;
    const result = await this.service.create(dto);
    res.status(201).json(result);
  }
}
```

### 2. Capa de Validación (DTOs + Validators)

**Responsabilidades:**
- Definir contratos de datos
- Validar tipos y formatos
- Transformar datos entrantes
- Sanitización de inputs

**Ejemplo:**

```typescript
export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  details: PurchaseOrderDetailDto[];
}
```

### 3. Capa de Negocio (Services)

**Responsabilidades:**
- Implementar lógica de negocio
- Coordinar operaciones entre entidades
- Aplicar reglas de negocio
- Cálculos y transformaciones
- Manejo de transacciones

**Ejemplo:**

```typescript
class PurchaseOrderService {
  async create(dto: CreatePurchaseOrderDto) {
    // Validar proveedor existe
    const supplier = await this.supplierRepo.findOne(dto.supplierId);
    
    // Calcular total
    const totalAmount = this.calculateTotal(dto.details);
    
    // Crear orden con transacción
    return await this.dataSource.transaction(async manager => {
      const order = manager.create(PurchaseOrder, {
        ...dto,
        totalAmount,
        status: PurchaseOrderStatus.PENDIENTE
      });
      return await manager.save(order);
    });
  }
}
```

### 4. Capa de Datos (Entities + TypeORM)

**Responsabilidades:**
- Definir estructura de datos
- Mapear a tablas de base de datos
- Definir relaciones entre entidades
- Gestionar timestamps y soft delete

**Ejemplo:**

```typescript
@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: string;

  @ManyToOne(() => Supplier)
  supplier: Supplier;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
```

---

## Estructura del Proyecto

```
tejada-hnos-backend/
├── src/
│   ├── index.ts                    # Punto de entrada de la aplicación
│   │
│   ├── config/                     # Configuraciones
│   │   ├── environment.ts          # Variables de entorno
│   │   └── typeorm.config.ts       # Configuración de TypeORM
│   │
│   ├── controllers/                # Controladores (HTTP handlers)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── purchase-order.controller.ts
│   │   └── ...
│   │
│   ├── services/                   # Lógica de negocio
│   │   ├── database.service.ts     # Inicialización de DB
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── purchase-order.service.ts
│   │   └── ...
│   │
│   ├── entities/                   # Modelos de TypeORM
│   │   ├── user.entity.ts
│   │   ├── purchase-order.entity.ts
│   │   └── ...
│   │
│   ├── dtos/                       # Data Transfer Objects
│   │   ├── user.dto.ts
│   │   ├── purchase-order.dto.ts
│   │   └── ...
│   │
│   ├── routes/                     # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── purchase-order.routes.ts
│   │   └── ...
│   │
│   ├── middlewares/                # Middlewares
│   │   ├── auth.middleware.ts      # Autenticación JWT
│   │   ├── authorize.middleware.ts # Autorización por roles
│   │   ├── validation.middleware.ts # Validación de DTOs
│   │   └── authorize-field-access.middleware.ts # Control de acceso a campos
│   │
│   ├── enums/                      # Enumeraciones
│   │   └── index.ts                # UserRole, ActivityType, etc.
│   │
│   ├── types/                      # Definiciones de tipos
│   │   └── index.ts                # GeoJSON, AuthRequest, etc.
│   │
│   ├── interfaces/                 # Interfaces TypeScript
│   │   └── ...
│   │
│   ├── utils/                      # Utilidades
│   │   └── ...
│   │
│   ├── exceptions/                 # Excepciones personalizadas
│   │   └── ...
│   │
│   └── scripts/                    # Scripts de mantenimiento
│       ├── seed-admin.ts           # Crear usuario admin
│       ├── seed-test-data.ts       # Datos de prueba
│       └── clean-test-data.ts      # Limpiar datos de prueba
│
├── docs/                           # Documentación legacy
├── docs_v2/                        # Nueva documentación completa
├── dist/                           # Código compilado
├── node_modules/                   # Dependencias
├── .env                            # Variables de entorno (no versionado)
├── .env.example                    # Plantilla de variables
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración de TypeScript
└── README.md                       # README principal
```

### Alias de Paths

El proyecto usa **module-alias** para imports limpios:

```typescript
// En lugar de:
import { User } from '../../../entities/user.entity';

// Usamos:
import { User } from '@entities/user.entity';
```

**Alias disponibles:**

```json
{
  "@": "dist",
  "@config": "dist/config",
  "@controllers": "dist/controllers",
  "@dtos": "dist/dtos",
  "@entities": "dist/entities",
  "@enums": "dist/enums",
  "@interfaces": "dist/interfaces",
  "@middlewares": "dist/middlewares",
  "@routes": "dist/routes",
  "@services": "dist/services",
  "@utils": "dist/utils"
}
```

---

## Patrones de Diseño

### 1. Repository Pattern (via TypeORM)

TypeORM proporciona el patrón Repository automáticamente:

```typescript
class PurchaseOrderService {
  private repository: Repository<PurchaseOrder>;
  
  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(PurchaseOrder);
  }
  
  async getAll() {
    return await this.repository.find({ 
      relations: ['supplier', 'details'] 
    });
  }
}
```

### 2. Dependency Injection

Inyección de dependencias manual en constructores:

```typescript
export const createPurchaseOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const controller = new PurchaseOrderController(dataSource);
  
  router.get('/', controller.getAll);
  return router;
};
```

### 3. DTO Pattern

Separación clara entre datos de entrada/salida y entidades:

```typescript
// DTO: Contrato de entrada
class CreatePurchaseOrderDto {
  supplierId: string;
  details: PurchaseOrderDetailDto[];
}

// Entity: Modelo de base de datos
class PurchaseOrder {
  id: string;
  supplierId: string;
  supplier: Supplier;
  status: string;
  totalAmount: number;
  createdAt: Date;
}
```

### 4. Middleware Pattern

Cadena de responsabilidad para procesamiento de requests:

```typescript
router.post('/',
  authenticate,           // 1. Verificar JWT
  authorize(ADMIN),       // 2. Verificar rol
  validateData(DTO),      // 3. Validar datos
  controller.create       // 4. Ejecutar acción
);
```

### 5. Service Layer Pattern

Lógica de negocio centralizada en servicios:

```typescript
class PurchaseOrderService {
  async create(dto) { /* lógica */ }
  async approve(id) { /* lógica */ }
  async cancel(id) { /* lógica */ }
}
```

---

## Base de Datos

### Gestión de Conexiones

```typescript
// config/typeorm.config.ts
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: ['dist/entities/**/*.js'],
  migrations: ['dist/migrations/**/*.js'],
});
```

### Convenciones de Base de Datos

- **Nombres de tablas**: snake_case, plural (ej: `purchase_orders`)
- **Nombres de columnas**: camelCase en TypeScript, snake_case en DB
- **IDs**: UUID v4 por defecto
- **Timestamps**: `createdAt`, `updatedAt`, `deletedAt` en todas las tablas
- **Soft Delete**: Habilitado por defecto con `@DeleteDateColumn()`

### Relaciones

```typescript
// One-to-Many
@OneToMany(() => Plot, plot => plot.field)
plots: Plot[];

// Many-to-One
@ManyToOne(() => Field, field => field.plots)
field: Field;

// Many-to-Many
@ManyToMany(() => Plot)
@JoinTable({ name: 'work_order_plots' })
plots: Plot[];
```

### Transacciones

Para operaciones que requieren atomicidad:

```typescript
await this.dataSource.transaction(async manager => {
  // Todas las operaciones aquí son atómicas
  const order = manager.create(PurchaseOrder, dto);
  await manager.save(order);
  
  for (const detail of dto.details) {
    const orderDetail = manager.create(PurchaseOrderDetail, {
      ...detail,
      purchaseOrderId: order.id
    });
    await manager.save(orderDetail);
  }
});
```

---

## Seguridad

### Autenticación JWT

```typescript
// Generación de token
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// Verificación
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

### Middleware de Autenticación

```typescript
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await userRepo.findOne({ where: { id: decoded.userId } });
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Autorización por Roles

```typescript
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Sin permisos' });
    }
    next();
  };
};
```

### Hash de Contraseñas

```typescript
const passwordHash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, user.passwordHash);
```

---

## Gestión de Errores

### Manejo Centralizado

```typescript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    status: err.statusCode || 500,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### Errores de Validación

```typescript
if (errors.length > 0) {
  return res.status(400).json({
    status: 400,
    message: 'Errores de validación',
    errors: errors.map(e => ({
      field: e.property,
      constraints: e.constraints
    }))
  });
}
```

---

## Configuración

### Variables de Entorno

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=tejada_hnos

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here
JWT_EXPIRES_IN=3h
JWT_REFRESH_EXPIRES_IN=7d
```

### Scripts NPM

```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node -r tsconfig-paths/register src/index.ts",
    "build": "tsc",
    "start": "node -r tsconfig-paths/register dist/index.js",
    "seed:admin": "ts-node -r tsconfig-paths/register src/scripts/seed-admin.ts",
    "seed:test": "ts-node -r tsconfig-paths/register src/scripts/seed-test-data.ts"
  }
}
```

---

## Mejores Prácticas

### 1. Separación de Responsabilidades

- **Routes**: Solo definir endpoints y middlewares
- **Controllers**: Solo manejar HTTP (request/response)
- **Services**: Toda la lógica de negocio
- **Entities**: Solo definición de estructura

### 2. Validación

- Siempre validar DTOs con `class-validator`
- No confiar en datos del cliente
- Sanitizar inputs

### 3. Seguridad

- Nunca exponer `passwordHash` en respuestas
- Usar `select: false` para campos sensibles
- Validar permisos antes de operaciones

### 4. Performance

- Usar `select` específicos cuando no se necesitan todas las columnas
- Cargar relaciones solo cuando sea necesario
- Usar paginación para listados grandes

### 5. Mantenibilidad

- Código autodocumentado con buenos nombres
- Comentarios JSDoc para funciones públicas
- Mantener funciones pequeñas y enfocadas

---

**Próximos pasos**: Consultar [MODELO_DATOS.md](./MODELO_DATOS.md) para entender la estructura de la base de datos.
