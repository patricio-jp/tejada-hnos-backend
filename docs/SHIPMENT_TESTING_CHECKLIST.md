# ✅ Checklist de Testing - API de Envíos

## 📋 Pre-requisitos

### Datos Necesarios
- [ ] Base de datos inicializada y corriendo
- [ ] Usuario ADMIN o CAPATAZ creado
- [ ] Al menos un cliente registrado
- [ ] Al menos un campo con parcelas
- [ ] Al menos un lote de cosecha en estado `EN_STOCK` con peso neto definido

### Configuración
- [ ] Servidor corriendo en puerto 3000 (o ajustar)
- [ ] Token JWT válido obtenido mediante login
- [ ] Variables de entorno configuradas correctamente

---

## 🧪 Pruebas Funcionales

### 1. Autenticación y Autorización

#### Test 1.1: Login exitoso
- [ ] POST `/auth/login` con credenciales válidas
- [ ] Respuesta 200 con token JWT
- [ ] Token se puede usar en siguientes requests

#### Test 1.2: Acceso sin token
- [ ] GET `/shipments` sin header Authorization
- [ ] Respuesta 401 Unauthorized

#### Test 1.3: Acceso con rol OPERARIO
- [ ] Login con usuario OPERARIO
- [ ] POST `/sale-orders/:id/shipments` con token de OPERARIO
- [ ] Respuesta 403 Forbidden

---

### 2. Validaciones de Entrada

#### Test 2.1: Body vacío
- [ ] POST `/sale-orders/:id/shipments` con body vacío
- [ ] Respuesta 400 con mensaje de error de validación

#### Test 2.2: lotDetails vacío
- [ ] POST con `lotDetails: []`
- [ ] Respuesta 400: "Debe incluir al menos un detalle de lote"

#### Test 2.3: Campos requeridos faltantes
- [ ] POST sin `harvestLotId`
- [ ] Respuesta 400 con error de validación
- [ ] POST sin `salesOrderDetailId`
- [ ] Respuesta 400 con error de validación
- [ ] POST sin `quantityTakenKg`
- [ ] Respuesta 400 con error de validación

#### Test 2.4: Cantidad negativa o cero
- [ ] POST con `quantityTakenKg: -100`
- [ ] Respuesta 400: "La cantidad debe ser mayor a 0"
- [ ] POST con `quantityTakenKg: 0`
- [ ] Respuesta 400: "La cantidad debe ser mayor a 0"

#### Test 2.5: UUIDs inválidos
- [ ] POST con `salesOrderId` inválido en URL
- [ ] Respuesta 400 o 404
- [ ] POST con `harvestLotId` inválido
- [ ] Respuesta 400 o 404

---

### 3. Validaciones de Negocio - Orden de Venta

#### Test 3.1: Orden no existe
- [ ] POST con UUID que no existe
- [ ] Respuesta 404: "Orden de venta no encontrada"

#### Test 3.2: Orden en estado PENDIENTE
- [ ] Crear orden en estado PENDIENTE
- [ ] POST intentando crear envío
- [ ] Respuesta 400: "La orden debe estar APROBADA o DESPACHADA_PARCIAL"

#### Test 3.3: Orden en estado CANCELADA
- [ ] POST con orden CANCELADA
- [ ] Respuesta 400 con mensaje apropiado

#### Test 3.4: SalesOrderDetail no pertenece a la orden
- [ ] POST con `salesOrderDetailId` de otra orden
- [ ] Respuesta 400: "Uno o más detalles no pertenecen a esta orden"

---

### 4. Validaciones de Negocio - Lote de Cosecha

#### Test 4.1: Lote no existe
- [ ] POST con `harvestLotId` que no existe
- [ ] Respuesta 404: "Lote de cosecha no encontrado"

#### Test 4.2: Lote en estado PENDIENTE_PROCESO
- [ ] POST con lote que no ha sido procesado
- [ ] Respuesta 400: "El lote no está disponible para envío"

#### Test 4.3: Lote sin peso neto definido
- [ ] POST con lote que tiene `netWeightKg = null`
- [ ] Respuesta 400: "El lote no tiene peso neto definido"

#### Test 4.4: Stock insuficiente
- [ ] POST con cantidad > `remainingNetWeightKg`
- [ ] Respuesta 400: "Stock insuficiente en Lote..."
- [ ] Verificar que NO se creó ningún registro (rollback)
- [ ] Verificar que el stock del lote NO cambió

#### Test 4.5: Variedad no coincide
- [ ] POST con lote de variedad "Chandler" para pedido de "Serr"
- [ ] Respuesta 400: "El lote es de variedad X, pero el pedido requiere Y"

#### Test 4.6: Calibre no coincide
- [ ] POST con lote calibre "LARGE" para pedido "MEDIUM"
- [ ] Respuesta 400: "El lote es de calibre X, pero el pedido requiere Y"

---

### 5. Validaciones de Negocio - Cantidad del Pedido

#### Test 5.1: Exceder cantidad pendiente
- [ ] Pedido de 1000kg con 300kg ya enviados
- [ ] POST con `quantityTakenKg: 800` (700kg pendientes)
- [ ] Respuesta 400: "No se puede enviar... Cantidad pendiente: 700kg"

---

### 6. Envío Exitoso - Escenario Simple

#### Test 6.1: Primer envío parcial (300kg de 1000kg)
**Setup:**
- [ ] Orden de 1000kg en estado APROBADA
- [ ] Lote con 2500kg disponibles (remainingNetWeightKg)
- [ ] Variedad y calibre coinciden

**Request:**
- [ ] POST `/sale-orders/:id/shipments` con 300kg

**Verificaciones:**
- [ ] Respuesta 201 Created
- [ ] Shipment creado con ID válido
- [ ] ShipmentLotDetail creado correctamente
- [ ] `harvestLot.remainingNetWeightKg` = 2200 (2500 - 300)
- [ ] `harvestLot.status` sigue siendo `EN_STOCK`
- [ ] `salesOrderDetail.quantityShipped` = 300
- [ ] `salesOrderDetail.status` = `DESPACHADA_PARCIAL`
- [ ] `salesOrder.status` = `DESPACHADA_PARCIAL`

#### Test 6.2: Completar envío (700kg restantes)
**Setup:**
- [ ] Mismo escenario anterior, ya con 300kg enviados

**Request:**
- [ ] POST `/sale-orders/:id/shipments` con 700kg

**Verificaciones:**
- [ ] Respuesta 201 Created
- [ ] Segundo shipment creado
- [ ] `harvestLot.remainingNetWeightKg` = 1500 (2200 - 700)
- [ ] `salesOrderDetail.quantityShipped` = 1000 (300 + 700)
- [ ] `salesOrderDetail.status` = `COMPLETA`
- [ ] `salesOrder.status` = `DESPACHADA_TOTAL`

---

### 7. Envío Exitoso - Múltiples Lotes

#### Test 7.1: Enviar desde 3 lotes diferentes
**Setup:**
- [ ] Orden con 3 líneas diferentes:
  - Línea 1: 500kg Chandler LARGE
  - Línea 2: 300kg Chandler MEDIUM
  - Línea 3: 200kg Serr LARGE
- [ ] 3 lotes correspondientes con stock suficiente

**Request:**
- [ ] POST con 3 detalles en `lotDetails`

**Verificaciones:**
- [ ] Respuesta 201 Created
- [ ] 3 ShipmentLotDetail creados
- [ ] Stock de los 3 lotes actualizado correctamente
- [ ] Cantidades enviadas actualizadas en las 3 líneas
- [ ] Estados de las 3 líneas correctos

---

### 8. Envío Exitoso - Agotar Lote

#### Test 8.1: Enviar exactamente todo el stock disponible
**Setup:**
- [ ] Lote con `remainingNetWeightKg` = 500kg
- [ ] Pedido con cantidad >= 500kg

**Request:**
- [ ] POST con `quantityTakenKg: 500`

**Verificaciones:**
- [ ] Respuesta 201 Created
- [ ] `harvestLot.remainingNetWeightKg` = 0
- [ ] `harvestLot.status` = `VENDIDO`

---

### 9. Transaccionalidad y Rollback

#### Test 9.1: Rollback por error en segundo lote
**Setup:**
- [ ] POST con 2 detalles
- [ ] Primer lote válido con stock
- [ ] Segundo lote sin stock suficiente

**Verificaciones:**
- [ ] Respuesta 400 con error del segundo lote
- [ ] Primer lote NO fue modificado (rollback)
- [ ] NO se creó el Shipment
- [ ] NO se crearon ShipmentLotDetail
- [ ] Estados originales preservados

#### Test 9.2: Rollback por variedad incorrecta
**Setup:**
- [ ] POST con lote de variedad incorrecta

**Verificaciones:**
- [ ] Respuesta 400
- [ ] Ningún cambio en base de datos
- [ ] Rollback completo exitoso

---

### 10. Consultas GET

#### Test 10.1: Obtener todos los envíos
- [ ] GET `/shipments`
- [ ] Respuesta 200 con array de shipments
- [ ] Relaciones cargadas correctamente
- [ ] Ordenados por fecha descendente

#### Test 10.2: Obtener envío por ID
- [ ] GET `/shipments/:id` con ID existente
- [ ] Respuesta 200 con shipment completo
- [ ] Todas las relaciones cargadas

#### Test 10.3: Obtener envío inexistente
- [ ] GET `/shipments/:id` con UUID que no existe
- [ ] Respuesta 404: "Envío no encontrado"

#### Test 10.4: Obtener envíos de una orden
- [ ] GET `/sale-orders/:salesOrderId/shipments`
- [ ] Respuesta 200 con array de shipments de esa orden
- [ ] Solo incluye envíos de esa orden específica

#### Test 10.5: Obtener envíos de orden sin envíos
- [ ] GET `/sale-orders/:salesOrderId/shipments` de orden nueva
- [ ] Respuesta 200 con array vacío

---

### 11. Edge Cases

#### Test 11.1: Decimales en cantidad
- [ ] POST con `quantityTakenKg: 123.45`
- [ ] Respuesta 201 Created
- [ ] Valores decimales manejados correctamente

#### Test 11.2: Envío con tracking number muy largo
- [ ] POST con `trackingNumber` de 255+ caracteres
- [ ] Verificar límites de base de datos

#### Test 11.3: Envío sin tracking number (opcional)
- [ ] POST sin incluir `trackingNumber`
- [ ] Respuesta 201 Created
- [ ] `trackingNumber` = null en base de datos

#### Test 11.4: Envío sin notas (opcional)
- [ ] POST sin incluir `notes`
- [ ] Respuesta 201 Created
- [ ] `notes` = null en base de datos

---

### 12. Concurrencia

#### Test 12.1: Dos envíos simultáneos del mismo lote
- [ ] Setup: Lote con 1000kg
- [ ] Request A: Enviar 600kg
- [ ] Request B: Enviar 600kg (simultáneo)
- [ ] Verificar que solo uno sea exitoso
- [ ] El otro debe fallar por stock insuficiente

---

## 📊 Verificaciones de Base de Datos

### Después de cada envío exitoso, verificar:

#### Tabla `shipments`
- [ ] Registro creado con ID único
- [ ] `salesOrderId` correcto
- [ ] `shipmentDate` con timestamp UTC
- [ ] Campos opcionales null si no fueron enviados

#### Tabla `shipment_lot_details`
- [ ] Registros creados para cada detalle
- [ ] Relaciones correctas (shipmentId, harvestLotId, salesOrderDetailId)
- [ ] `quantityTakenKg` con valor correcto

#### Tabla `harvest_lots`
- [ ] `remainingNetWeightKg` decrementado correctamente
- [ ] `status` actualizado a `VENDIDO` si corresponde
- [ ] Valores con precisión decimal correcta

#### Tabla `sales_order_details`
- [ ] `quantityShipped` incrementado correctamente
- [ ] `status` actualizado según lógica de negocio

#### Tabla `sales_orders`
- [ ] `status` actualizado según estados de todas las líneas
- [ ] `updatedAt` actualizado

---

## 🎯 Métricas de Éxito

- [ ] Todos los tests funcionales pasan (100%)
- [ ] Rollback funciona en todos los casos de error
- [ ] No hay fugas de datos en caso de error
- [ ] Performance aceptable (< 500ms para envío simple)
- [ ] No hay errores 500 en ningún escenario
- [ ] Validaciones cubren todos los edge cases
- [ ] Documentación coincide con comportamiento real

---

## 📝 Notas de Testing

### Herramientas Recomendadas
- Thunder Client (VS Code)
- Postman
- REST Client (VS Code Extension)
- Manual SQL queries para verificar estado

### Datos de Prueba
Usar el archivo `docs/shipment-api-tests.http` para ejemplos completos

### Orden de Ejecución
1. Pruebas de autenticación
2. Pruebas de validación de entrada
3. Pruebas de validaciones de negocio
4. Pruebas de flujo exitoso
5. Pruebas de edge cases
6. Pruebas de concurrencia

---

## ✅ Sign-off

### Testing Completado por:
- **Nombre:** _________________
- **Fecha:** _________________
- **Resultado:** _________________
- **Notas:** _________________

### Bugs Encontrados:
1. _________________
2. _________________
3. _________________

### Mejoras Sugeridas:
1. _________________
2. _________________
3. _________________
