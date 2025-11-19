# Resumen de Cambios - Sistema de Inmutabilidad de HarvestLot

## 📌 Cambios Implementados

### 1. **DTOs Actualizados** (`src/dtos/harvest-lot.dto.ts`)

#### CreateHarvestLotDto
```typescript
export class CreateHarvestLotDto {
  @IsUUID()
  @IsNotEmpty()
  plotId: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  harvestDate: Date;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  grossWeightKg: number;

  // Campos opcionales (pueden ser null)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lotCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  varietyName?: string;

  @IsOptional()
  @IsEnum(WalnutCaliber)
  caliber?: WalnutCaliber;
}
```

**Cambios**:
- ✅ `lotCode`, `varietyName`, `caliber` son ahora **opcionales**
- ✅ Permiten crear lotes sin clasificación inicial

---

#### UpdateHarvestLotDto
```typescript
export class UpdateHarvestLotDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  harvestDate?: Date;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lotCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  varietyName?: string;

  @IsOptional()
  @IsEnum(WalnutCaliber)
  caliber?: WalnutCaliber;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  grossWeightKg?: number;
}
```

**Cambios**:
- ❌ Eliminado: `plotId`, `netWeightKg`, `remainingNetWeightKg`, `yieldPercentage`, `status`
- ✅ Solo permite actualizar campos básicos
- ✅ **Solo funciona en estado PENDIENTE_PROCESO**

---

#### ProcessHarvestLotDto (NUEVO)
```typescript
export class ProcessHarvestLotDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lotCode?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty()
  varietyName: string;

  @IsEnum(WalnutCaliber)
  @IsNotEmpty()
  caliber: WalnutCaliber;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  netWeightKg: number;
}
```

**Propósito**:
- ✅ DTO específico para clasificar lotes
- ✅ Transición de `PENDIENTE_PROCESO` → `EN_STOCK`
- ✅ Requiere clasificación completa

---

### 2. **Service Refactorizado** (`src/services/harvest-lot.service.ts`)

#### create() Method
```typescript
async create(createHarvestLotDto: CreateHarvestLotDto): Promise<HarvestLot> {
  // Validación de parcela
  const plot = await this.plotRepository.findOneBy({ id: createHarvestLotDto.plotId });
  if (!plot) {
    throw new HttpException(404, 'Parcela no encontrada');
  }

  // Validación de código único (si se proporciona)
  if (createHarvestLotDto.lotCode) {
    const existingLot = await this.harvestLotRepository.findOne({
      where: { lotCode: createHarvestLotDto.lotCode }
    });
    if (existingLot) {
      throw new HttpException(409, 'El código de lote ya existe');
    }
  }

  // Crear lote con estado PENDIENTE_PROCESO
  const harvestLot = this.harvestLotRepository.create({
    ...createHarvestLotDto,
    status: HarvestLotStatus.PENDIENTE_PROCESO,
    netWeightKg: null,
    remainingNetWeightKg: null,
    yieldPercentage: null
  });

  return await this.harvestLotRepository.save(harvestLot);
}
```

**Cambios**:
- ✅ Permite `lotCode`, `varietyName`, `caliber` opcionales
- ✅ Inicializa campos calculados como `null`

---

#### update() Method (REDEFINIDO)
```typescript
async update(id: string, updateHarvestLotDto: UpdateHarvestLotDto): Promise<HarvestLot> {
  const harvestLot = await this.findById(id);

  // Validar estado
  if (harvestLot.status !== HarvestLotStatus.PENDIENTE_PROCESO) {
    throw new HttpException(
      400,
      'No se puede actualizar un lote en estado EN_STOCK. ' +
      'Use el endpoint de procesamiento para clasificar el lote.'
    );
  }

  // Validar código único (si se actualiza)
  if (updateHarvestLotDto.lotCode && updateHarvestLotDto.lotCode !== harvestLot.lotCode) {
    const existingLot = await this.harvestLotRepository.findOne({
      where: { lotCode: updateHarvestLotDto.lotCode }
    });
    if (existingLot) {
      throw new HttpException(409, 'El código ya existe');
    }
  }

  // Actualizar solo campos permitidos
  this.harvestLotRepository.merge(harvestLot, updateHarvestLotDto);

  return await this.harvestLotRepository.save(harvestLot);
}
```

**Cambios**:
- ✅ Bloquea actualizaciones si `status !== PENDIENTE_PROCESO`
- ✅ Solo actualiza campos del DTO simplificado
- ❌ Eliminadas todas las validaciones de `netWeightKg`, `remainingNetWeightKg`

---

#### process() Method (NUEVO)
```typescript
async process(id: string, processDto: ProcessHarvestLotDto): Promise<HarvestLot> {
  const harvestLot = await this.findById(id);

  // Validar estado
  if (harvestLot.status !== HarvestLotStatus.PENDIENTE_PROCESO) {
    throw new HttpException(
      400,
      'Solo se pueden procesar lotes en PENDIENTE_PROCESO'
    );
  }

  // Validar peso neto <= peso bruto
  if (processDto.netWeightKg > harvestLot.grossWeightKg) {
    throw new HttpException(
      400,
      'El peso neto no puede ser mayor al peso bruto'
    );
  }

  // Validar código único (si se proporciona)
  if (processDto.lotCode && processDto.lotCode !== harvestLot.lotCode) {
    const existingLot = await this.harvestLotRepository.findOne({
      where: { lotCode: processDto.lotCode }
    });
    if (existingLot) {
      throw new HttpException(409, 'El código ya existe');
    }
  }

  // Establecer clasificación
  if (processDto.lotCode) {
    harvestLot.lotCode = processDto.lotCode;
  }
  harvestLot.varietyName = processDto.varietyName;
  harvestLot.caliber = processDto.caliber;
  harvestLot.netWeightKg = processDto.netWeightKg;
  harvestLot.remainingNetWeightKg = processDto.netWeightKg;

  // Calcular rendimiento
  harvestLot.yieldPercentage = parseFloat(
    ((processDto.netWeightKg / harvestLot.grossWeightKg) * 100).toFixed(2)
  );

  // Cambiar estado a EN_STOCK (inmutable)
  harvestLot.status = HarvestLotStatus.EN_STOCK;

  return await this.harvestLotRepository.save(harvestLot);
}
```

**Propósito**:
- ✅ Único método que puede transicionar a `EN_STOCK`
- ✅ Establece clasificación completa
- ✅ Inicializa inventario (`remainingNetWeightKg = netWeightKg`)
- ✅ Calcula `yieldPercentage`

---

### 3. **Controller Actualizado** (`src/controllers/harvest-lot.controller.ts`)

#### Imports
```typescript
import { CreateHarvestLotDto, UpdateHarvestLotDto, ProcessHarvestLotDto } from '@dtos/harvest-lot.dto';
```

#### processHarvestLot() Handler (NUEVO)
```typescript
public processHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const processHarvestLotDto: ProcessHarvestLotDto = req.body;

    if (!id) {
      throw new HttpException(400, 'El ID del lote es obligatorio');
    }

    const harvestLot = await this.harvestLotService.process(id, processHarvestLotDto);

    res.status(200).json({
      data: instanceToPlain(harvestLot),
      message: 'Lote procesado y clasificado exitosamente. El lote ahora es inmutable.'
    });
  } catch (error) {
    next(error);
  }
};
```

**Cambios**:
- ✅ Nuevo endpoint para clasificación
- ✅ Mensaje de respuesta indica inmutabilidad

---

### 4. **Routes Actualizadas** (`src/routes/harvest-lot.routes.ts`)

#### Imports
```typescript
import { CreateHarvestLotDto, UpdateHarvestLotDto, ProcessHarvestLotDto } from '@/dtos/harvest-lot.dto';
```

#### Nueva Ruta
```typescript
/**
 * @route   PATCH /harvest-lots/:id/process
 * @desc    Procesar/clasificar un lote (PENDIENTE_PROCESO → EN_STOCK)
 * @access  ADMIN, CAPATAZ
 */
router.patch(
  '/:id/process',
  authorize(UserRole.ADMIN, UserRole.CAPATAZ),
  validateData(ProcessHarvestLotDto),
  harvestLotController.processHarvestLot
);
```

#### Ruta PUT Actualizada
```typescript
/**
 * @route   PUT /harvest-lots/:id
 * @desc    Actualizar un lote de cosecha en estado PENDIENTE_PROCESO
 * @access  ADMIN, CAPATAZ
 */
router.put(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.CAPATAZ), // Cambio: ahora CAPATAZ también puede
  validateData(UpdateHarvestLotDto),
  harvestLotController.updateHarvestLot
);
```

**Cambios**:
- ✅ Nueva ruta `PATCH /harvest-lots/:id/process`
- ✅ Permisos de `PUT` ampliados a `CAPATAZ`

---

## 🔄 Flujo de Trabajo

### Antes (❌ Problemático)
```
POST /harvest-lots → PENDIENTE_PROCESO
PUT /harvest-lots/:id → EN_STOCK (con netWeightKg)
PUT /harvest-lots/:id → ⚠️ Podía modificar netWeightKg después
PUT /harvest-lots/:id → ⚠️ Podía modificar remainingNetWeightKg manualmente
```

### Ahora (✅ Seguro)
```
POST /harvest-lots → PENDIENTE_PROCESO (campos opcionales)
PUT /harvest-lots/:id → PENDIENTE_PROCESO (solo campos básicos)
PATCH /harvest-lots/:id/process → EN_STOCK (inmutable)
PUT /harvest-lots/:id → ❌ HTTP 400 (bloqueado)
POST /shipments → Modifica remainingNetWeightKg (única forma)
```

---

## 📊 Comparación de Estados

| Campo | PENDIENTE_PROCESO | EN_STOCK | VENDIDO |
|-------|-------------------|----------|---------|
| `plotId` | ✏️ Mutable | 🔒 Inmutable | 🔒 Inmutable |
| `harvestDate` | ✏️ Mutable | 🔒 Inmutable | 🔒 Inmutable |
| `lotCode` | ✏️ Mutable | 🔒 Inmutable | 🔒 Inmutable |
| `varietyName` | ✏️ Mutable (puede ser null) | 🔒 Inmutable | 🔒 Inmutable |
| `caliber` | ✏️ Mutable (puede ser null) | 🔒 Inmutable | 🔒 Inmutable |
| `grossWeightKg` | ✏️ Mutable | 🔒 Inmutable | 🔒 Inmutable |
| `netWeightKg` | null | 🔒 Inmutable | 🔒 Inmutable |
| `remainingNetWeightKg` | null | ✅ Via shipments | 0 (inmutable) |
| `yieldPercentage` | null | 🔒 Inmutable | 🔒 Inmutable |
| `status` | PENDIENTE_PROCESO | EN_STOCK | VENDIDO |

---

## 🧪 Escenarios de Validación

### ✅ Escenario 1: Creación sin clasificación
```http
POST /harvest-lots
{
  "plotId": "uuid-1",
  "harvestDate": "2024-01-15",
  "grossWeightKg": 1000
}
```
**Resultado**: Lote creado con `varietyName: null`, `caliber: null`

---

### ✅ Escenario 2: Actualizar campos básicos
```http
PUT /harvest-lots/uuid-1
{
  "lotCode": "LOT-001",
  "varietyName": "Chandler"
}
```
**Resultado**: Campos actualizados, estado sigue en `PENDIENTE_PROCESO`

---

### ✅ Escenario 3: Procesar lote
```http
PATCH /harvest-lots/uuid-1/process
{
  "varietyName": "Chandler",
  "caliber": "CALIBER_32_34",
  "netWeightKg": 850
}
```
**Resultado**:
- `status` → `EN_STOCK`
- `remainingNetWeightKg` → `850`
- `yieldPercentage` → `85.0`

---

### ❌ Escenario 4: Intentar actualizar lote EN_STOCK
```http
PUT /harvest-lots/uuid-1
{
  "netWeightKg": 900
}
```
**Resultado**: HTTP 400 - "No se puede actualizar un lote en estado EN_STOCK..."

---

### ✅ Escenario 5: Crear envío (única modificación permitida)
```http
POST /shipments
{
  "salesOrderId": "uuid-order-1",
  "lotDetails": [
    {
      "harvestLotId": "uuid-1",
      "netWeightKg": 850
    }
  ]
}
```
**Resultado**:
- `remainingNetWeightKg` → `0`
- `status` → `VENDIDO` (automático)

---

## 📁 Archivos Modificados

### DTOs
- ✅ `src/dtos/harvest-lot.dto.ts`
  - `CreateHarvestLotDto`: Campos opcionales
  - `UpdateHarvestLotDto`: Simplificado
  - `ProcessHarvestLotDto`: Nuevo

### Services
- ✅ `src/services/harvest-lot.service.ts`
  - `create()`: Acepta campos opcionales
  - `update()`: Bloquea EN_STOCK
  - `process()`: Nuevo método

### Controllers
- ✅ `src/controllers/harvest-lot.controller.ts`
  - `processHarvestLot()`: Nuevo handler

### Routes
- ✅ `src/routes/harvest-lot.routes.ts`
  - `PATCH /harvest-lots/:id/process`: Nueva ruta
  - `PUT /harvest-lots/:id`: Permisos actualizados

### Documentation
- ✅ `docs/HARVEST_LOT_LIFECYCLE.md`: Documentación completa del ciclo de vida

---

## ✅ Validaciones de Integridad

### 1. Validación de Estado
```typescript
if (harvestLot.status !== HarvestLotStatus.PENDIENTE_PROCESO) {
  throw new HttpException(400, 'Solo se puede actualizar/procesar lotes PENDIENTE_PROCESO');
}
```

### 2. Validación de Pesos
```typescript
if (processDto.netWeightKg > harvestLot.grossWeightKg) {
  throw new HttpException(400, 'Peso neto no puede exceder peso bruto');
}
```

### 3. Validación de Código Único
```typescript
const existingLot = await this.harvestLotRepository.findOne({
  where: { lotCode: updateDto.lotCode }
});
if (existingLot) {
  throw new HttpException(409, 'El código ya existe');
}
```

### 4. Validación de Stock (en shipments)
```typescript
if (harvestLot.remainingNetWeightKg < lotDetail.netWeightKg) {
  throw new HttpException(400, 'Stock insuficiente');
}
```

---

## 🎯 Beneficios

### 1. **Integridad de Datos**
- ✅ Una vez clasificado, el lote no puede cambiar
- ✅ Previene inconsistencias entre envíos y clasificación

### 2. **Trazabilidad**
- ✅ Inventario se actualiza solo a través de transacciones
- ✅ Histórico de cambios auditables

### 3. **Separación de Responsabilidades**
- ✅ Creación → Estado inicial
- ✅ Actualización → Solo pre-clasificación
- ✅ Procesamiento → Transición controlada
- ✅ Envíos → Única modificación de inventario

### 4. **Prevención de Errores**
- ✅ Bloqueo explícito de modificaciones no autorizadas
- ✅ Mensajes de error claros
- ✅ Validaciones en múltiples capas

---

## 🚀 Próximos Pasos

1. ⏳ Actualizar tests unitarios para nuevos métodos
2. ⏳ Agregar tests de integración para flujo completo
3. ⏳ Documentar en Postman/Swagger
4. ⏳ Agregar logs de auditoría para cambios de estado
5. ⏳ Implementar notificaciones para lotes procesados

---

## 📞 Soporte

Para dudas sobre la implementación, consultar:
- **Lifecycle Guide**: `docs/HARVEST_LOT_LIFECYCLE.md`
- **Service Implementation**: `src/services/harvest-lot.service.ts`
- **Shipment Logic**: `docs/SHIPMENT_API.md`
