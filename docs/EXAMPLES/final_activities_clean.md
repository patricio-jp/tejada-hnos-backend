# Plan de Actividades - Sistema ERP Tejada Hnos.

## Contexto del Proyecto
Sistema de gestión agrícola integral para la producción de nueces, desarrollado con Node.js/TypeScript (backend) y React/TypeScript + Vite (frontend). El sistema gestiona desde la compra de insumos hasta la venta y envío del producto final, con trazabilidad completa y roles diferenciados (Administrador, Capataz, Operario).

---

## Fase Inicial: Planificación y Configuración

### 1. Reuniones e ingeniería de requisitos
  - **Inicio:** 25/08/2025
  - **Fin:** 30/08/2025
  - **Duración:** 1 semana
  - **Descripción:** Serie de reuniones con el cliente para definir y documentar requisitos funcionales y no funcionales del sistema. Identificación de actores (Administrador, Capataz, Operario), flujos de trabajo principales, y especificaciones de trazabilidad de productos desde compra de insumos hasta venta final. Elaboración de casos de uso y definición del alcance del proyecto.

### 2. Diseño de la arquitectura del sistema
  - **Inicio:** 31/08/2025
  - **Fin:** 05/09/2025
  - **Duración:** 1 semana
  - **Descripción:** Diseño de arquitectura cliente-servidor con separación de responsabilidades. Definición de arquitectura monolítica en capas (Layered Architecture) con patrón MVC para backend: capa de controladores (Controllers), capa de servicios (Services), capa de acceso a datos (TypeORM Repositories), y capa de entidades. Selección de stack tecnológico: Node.js + TypeScript + Express + TypeORM + PostgreSQL para backend REST API, React + TypeScript + Vite para frontend SPA. Creación de diagramas de arquitectura, modelos de datos preliminares, diagrama entidad-relación con 19 entidades, y documentación de flujos de autenticación/autorización. Definición de estructura de carpetas modular por dominio (auth, users, fields, plots, activities, purchases, sales, etc.).

### 3. Configuración de entorno de desarrollo y base de datos
  - **Inicio:** 06/09/2025
  - **Fin:** 13/09/2025
  - **Duración:** 1 semana
  - **Descripción:** Configuración completa del entorno de desarrollo para el equipo de 4 desarrolladores (2 backend, 2 frontend). Instalación y configuración de Node.js v18+, PostgreSQL v12+, configuración de repositorios Git separados para backend y frontend. Estructura de carpetas y archivos base para ambos proyectos. Creación del esquema de base de datos inicial en PostgreSQL con tablas base. Configuración de variables de entorno, scripts de desarrollo (npm run dev), y herramientas de versionado. Setup de ESLint, Prettier para mantener calidad de código. Documentación de comandos útiles y guía de instalación.

---

## Backend (Equipo de 2 desarrolladores)

### 4. B1: Implementación de entidades TypeORM, DTOs y validaciones
  - **Inicio:** 14/09/2025
  - **Fin:** 27/09/2025
  - **Duración:** 2 semanas
  - **Descripción:** Desarrollo de 19 entidades TypeORM que representan el modelo de datos completo del sistema: User, Customer, Supplier, Variety (variedades de nueces), Input (insumos), Field (campos), Plot (parcelas), PurchaseOrder, PurchaseOrderDetail, GoodsReceipt, GoodsReceiptDetail (remitos de recepción), WorkOrder (órdenes de trabajo), Activity (registro de actividades agrícolas), InputUsage (uso de insumos en actividades), HarvestLot (lotes de cosecha), SaleOrder, SaleOrderDetail, Shipment, ShipmentLotDetail. Implementación de relaciones entre entidades (OneToMany, ManyToOne, ManyToMany), configuración de cascadas, índices, y restricciones de integridad. Creación de DTOs con validaciones usando class-validator para cada operación CRUD. Documentación de estructura de datos y relaciones en diagramas ER.

### 5. B2: Sistema de autenticación JWT, roles y autorización por campos gestionados
  - **Inicio:** 28/09/2025
  - **Fin:** 11/10/2025
  - **Duración:** 2 semanas
  - **Descripción:** Implementación completa del sistema de autenticación y autorización con JWT. Desarrollo de endpoints de login, registro, refresh token y logout. Generación de access tokens (3h de duración) y refresh tokens (7d de duración) con almacenamiento en base de datos para revocación. Encriptación de contraseñas con bcrypt (10 rounds). Implementación de middleware de autenticación (authenticate) para validar tokens JWT en peticiones protegidas. Desarrollo de middleware de autorización por roles (authorize) con tres niveles: ADMIN (acceso total), CAPATAZ (acceso a campos gestionados asignados), OPERARIO (acceso solo a tareas asignadas). Implementación de middleware avanzado de autorización por campos gestionados (authorizeFieldAccess) que filtra automáticamente datos según los campos que gestiona cada usuario. Script de seed para crear usuario administrador inicial. Pruebas manuales de flujos de autenticación.

### 6. B3: Endpoints CRUD para entidades maestras (Variety, Customer, Supplier, Input)
  - **Inicio:** 12/10/2025
  - **Fin:** 18/10/2025
  - **Duración:** 1 semana
  - **Descripción:** Desarrollo de controladores, servicios y rutas para operaciones CRUD completas de entidades maestras. Implementación de endpoints REST para Variety (variedades de nueces: Chandler, Serr, etc.), Customer (clientes compradores con filtrado de activos/inactivos), Supplier (proveedores de insumos con filtrado similar), e Input (insumos agrícolas: fertilizantes, pesticidas, herramientas). Integración de middlewares de autenticación y autorización en rutas. Validación de DTOs en operaciones de creación y actualización. Manejo de errores personalizado con códigos HTTP apropiados. Pruebas con Postman/Thunder Client de todos los endpoints.

### 7. B4: Lógica transaccional de Compras con seguimiento de recepciones
  - **Inicio:** 19/10/2025
  - **Fin:** 01/11/2025
  - **Duración:** 2 semanas
  - **Descripción:** Implementación del sistema completo de gestión de órdenes de compra con seguimiento avanzado. Desarrollo de lógica transaccional para creación de PurchaseOrder con múltiples PurchaseOrderDetail (ítems de la orden). Sistema de seguimiento de estados: PENDING (pendiente), PARTIAL (recepción parcial), COMPLETED (completada), CANCELLED (cancelada). Implementación de GoodsReceipt (remitos de recepción) con GoodsReceiptDetail para registrar recepciones parciales o totales. Cálculo automático de cantidades recibidas vs. pendientes por cada ítem (quantityReceived, quantityPending, isFullyReceived). Actualización automática de precios unitarios de insumos tras recepciones. Endpoints para consultar estado de órdenes, historial de recepciones, y reportes de pendientes. Implementación de transacciones de base de datos para garantizar consistencia. Pruebas de escenarios complejos (recepciones parciales múltiples, cancelaciones).

### 8. B5: Endpoints CRUD para Campos y Parcelas con geometrías GeoJSON
  - **Inicio:** 02/11/2025
  - **Fin:** 08/11/2025
  - **Duración:** 1 semana
  - **Descripción:** Desarrollo de controladores y servicios para gestión de Field (campos agrícolas) y Plot (parcelas dentro de campos). Implementación de almacenamiento de geometrías geoespaciales en formato GeoJSON para representación de polígonos de campos y parcelas. Relaciones jerárquicas Field → Plots con validación de que cada parcela pertenezca a un campo existente. Endpoints para operaciones CRUD con filtrado por campo, búsqueda por nombre, y ordenamiento. Validación de superposición de geometrías. Integración con sistema de autorización por campos gestionados: Capataces solo acceden a sus campos asignados. Pruebas con datos GeoJSON reales.

### 9. B6: Endpoints CRUD para Órdenes de Trabajo con asignación de tareas
  - **Inicio:** 09/11/2025
  - **Fin:** 14/11/2025
  - **Duración:** 1 semana (6 días)
  - **Descripción:** Implementación del sistema de WorkOrder (órdenes de trabajo) que permite a los Capataces planificar actividades agrícolas. Desarrollo de endpoints para crear órdenes de trabajo asignadas a parcelas específicas, con fecha programada, tipo de tarea (riego, fertilización, poda, cosecha, etc.), descripción, y asignación a operarios. Sistema de estados: PENDING, IN_PROGRESS, COMPLETED, CANCELLED. Validación de autorización: Capataces solo pueden crear órdenes para parcelas de sus campos gestionados. Endpoints de consulta con filtros por estado, fecha, parcela, operario asignado. Relación con Activities para seguimiento de ejecución real. Pruebas de autorización con diferentes roles de usuario.

### 10. B7: Lógica transaccional de Actividades con registro de uso de insumos
  - **Inicio:** 02/11/2025
  - **Fin:** 13/11/2025
  - **Duración:** 1.5 semanas (en paralelo con B6)
  - **Descripción:** Desarrollo de la lógica compleja de Activity (registro de actividades agrícolas ejecutadas). Los operarios registran actividades realizadas en parcelas específicas, asociadas o no a WorkOrders. Sistema de validación de autorizaciones: Operarios solo registran actividades de órdenes asignadas a ellos. Registro de múltiples InputUsage por actividad (qué insumos se usaron, cantidades, unidades). Validación de stock disponible de insumos. Actualización automática de inventario tras registrar uso. Cálculo de costos por actividad basado en insumos utilizados. Estados de actividad: PLANNED, IN_PROGRESS, COMPLETED. Endpoints para listar actividades con filtros por parcela, fecha, operario, tipo. Integración con WorkOrders para marcar avance. Implementación de transacciones para asegurar consistencia en uso de insumos. Pruebas manuales de flujos completos operario.

### 11. B8: Sistema de Lotes de Cosecha con agregación y trazabilidad
  - **Inicio:** 09/11/2025
  - **Fin:** 14/11/2025
  - **Duración:** 6 días (en paralelo con B6)
  - **Descripción:** Implementación de HarvestLot (lotes de cosecha) que agrupa la producción recolectada de una o múltiples parcelas. Sistema de agrupación flexible: un lote puede contener cosecha de múltiples parcelas del mismo campo. Registro de variedad de nuez, cantidad total cosechada (kg), fecha de cosecha, estado de calidad, y ubicación de almacenamiento. Vinculación con Activities de tipo HARVEST para trazabilidad de origen. Sistema de estados: HARVESTED (cosechado), IN_STORAGE (en almacén), ALLOCATED (asignado a venta), SHIPPED (enviado). Endpoints para crear lotes, consultar inventario disponible, y tracking de lotes. Validación de cantidades y fechas. Tests de integración con Jest.

### 12. B9: Lógica transaccional de Ventas con asignación de lotes
  - **Inicio:** 15/11/2025
  - **Fin:** 21/11/2025
  - **Duración:** 1 semana (7 días)
  - **Descripción:** Desarrollo del sistema de SaleOrder (órdenes de venta) para comercialización de la producción. Creación de órdenes de venta con múltiples SaleOrderDetail (ítems vendidos), asignación de lotes de cosecha a ítems de venta. Validación de disponibilidad de stock de lotes. Sistema de estados: PENDING (pendiente), CONFIRMED (confirmada), SHIPPED (enviada), DELIVERED (entregada), CANCELLED (cancelada). Cálculo automático de totales, subtotales, y ganancias. Actualización de estado de lotes a ALLOCATED al asignar a ventas. Endpoints para gestión completa de ventas, consultas por cliente, fecha, estado. Implementación de transacciones para asegurar consistencia en asignación de lotes. Pruebas de escenarios de venta completos.

### 13. B10: Lógica transaccional de Envíos con tracking de lotes
  - **Inicio:** 22/11/2025
  - **Fin:** 27/11/2025
  - **Duración:** 6 días
  - **Descripción:** Implementación de Shipment (envíos) para despacho físico de productos. Sistema de ShipmentLotDetail para tracking detallado de qué lotes de cosecha se incluyen en cada envío, con cantidades específicas. Vinculación Shipment ↔ SaleOrder para relacionar envíos con ventas. Estados: PREPARING (preparando), IN_TRANSIT (en tránsito), DELIVERED (entregado). Registro de fecha de envío, transporte, guía de seguimiento, y fecha estimada/real de entrega. Actualización automática de estado de lotes a SHIPPED. Validación de cantidades enviadas vs. vendidas. Endpoints de consulta con filtros. Pruebas de flujo completo de venta a envío.

### 14. B11: Endpoints de Reportes con métricas y analytics
  - **Inicio:** 28/11/2025
  - **Fin:** 30/11/2025
  - **Duración:** 3 días
  - **Descripción:** Desarrollo de endpoints especializados para generación de reportes gerenciales y operativos. Reportes de producción por campo/parcela/período, reporte de uso de insumos con costos asociados, reporte de ventas con ganancias, reporte de inventario actual de lotes. Implementación de agregaciones SQL complejas con TypeORM QueryBuilder. Filtros flexibles por fechas, campos, clientes, estados. Formatos de respuesta optimizados para gráficos y tablas. Endpoints de métricas KPI: productividad por hectárea, costos por actividad, tasa de conversión cosecha-venta. Optimización de consultas para rendimiento con grandes volúmenes de datos.

### 15. B12: Endpoint de trazabilidad End-to-End (E2E)
  - **Inicio:** 28/11/2025
  - **Fin:** 30/11/2025
  - **Duración:** 3 días (en paralelo con B11)
  - **Descripción:** Implementación de endpoint de trazabilidad completa que permite rastrear el ciclo de vida de un producto desde su origen hasta el destino final. Dado un lote de cosecha, se traza hacia atrás: parcelas de origen → actividades realizadas → insumos utilizados → órdenes de compra de insumos. Trazabilidad hacia adelante: lote → ventas asignadas → envíos realizados → clientes destino. Respuestas estructuradas con timeline completo, actores involucrados, y documentos asociados. Endpoint inverso: dado un shipment, identificar origen completo. Validación de integridad de datos y manejo de casos edge (lotes sin actividades registradas, etc.). Optimización de consultas con joins eficientes.

---

## Frontend (Equipo de 2 desarrolladores)

### 16. F1: Sistema de diseño y componentes base con Shadcn/UI
  - **Inicio:** 14/09/2025
  - **Fin:** 20/09/2025
  - **Duración:** 1 semana
  - **Descripción:** Definición del sistema de diseño visual de la aplicación basado en Shadcn/UI y Tailwind CSS. Creación de paleta de colores corporativa adaptada a la identidad visual, tipografía (Inter/Roboto), espaciados consistentes, y componentes base reutilizables: botones, inputs, cards, modales, tablas, formularios. Configuración de Tailwind CSS con tema personalizado y dark mode opcional. Implementación de componentes de layout: Navbar con navegación por roles, Sidebar colapsable, Footer con información de la empresa. Diseño responsivo mobile-first para acceso desde dispositivos móviles en campo. Creación de biblioteca de iconos con Lucide React. Sistema de componentes documentado internamente para el equipo.

### 17. F2: Autenticación, manejo de roles y ruteo protegido
  - **Inicio:** 21/09/2025
  - **Fin:** 27/09/2025
  - **Duración:** 1 semana
  - **Descripción:** Implementación del módulo de autenticación en frontend con React Context API (AuthContext) para gestión global de estado de sesión. Desarrollo de páginas de Login y Register con validación de formularios usando React Hook Form y Zod schemas. Integración con endpoints de autenticación del backend (login, refresh token, logout). Almacenamiento seguro de tokens en localStorage con configuración de interceptores http para incluir tokens automáticamente en headers de peticiones. Sistema de ruteo protegido con React Router v6: componente ProtectedRoute que valida autenticación y roles (ADMIN, CAPATAZ, OPERARIO), redirigiendo a login si no hay sesión válida. Manejo automático de expiración de tokens con refresh token. Componente de perfil de usuario con opción de cambiar contraseña. Pruebas manuales de flujos de autenticación y autorización por rol.

### 18. F3: Interfaces CRUD para maestros de datos (Variety, Customer, Supplier, Input)
  - **Inicio:** 28/09/2025
  - **Fin:** 04/10/2025
  - **Duración:** 1 semana
  - **Descripción:** Desarrollo de interfaces completas para gestión de entidades maestras en módulos separados. Implementación de DataTables interactivas con TanStack Table (React Table v8) con paginación del lado del servidor, búsqueda en tiempo real, ordenamiento por columnas, y filtros avanzados. Modales de creación y edición con formularios validados usando React Hook Form y Zod. Botones de acciones CRUD: crear, editar, eliminar (con modal de confirmación). Manejo de estados de carga con skeletons, errores con mensajes descriptivos, y éxito con toast notifications (Sonner). Componente reutilizable DataTable altamente parametrizable. Filtros por estado activo/inactivo con badges visuales. Pruebas manuales de todos los flujos CRUD.

### 19. F4: Módulo de Compras con gestión de órdenes y recepciones
  - **Inicio:** 05/10/2025
  - **Fin:** 18/10/2025
  - **Duración:** 2 semanas
  - **Descripción:** Implementación del módulo completo de Purchases con múltiples vistas interconectadas. Página de listado de órdenes de compra con DataTable avanzada filtrable por estado (PENDING/PARTIAL/COMPLETED), rango de fechas, y proveedor. Vista de detalle de orden (PurchaseOrderDetail) con tabla de ítems mostrando estado de recepción detallado (cantidad pedida vs. recibida con progress bars). Formulario wizard de creación de orden de compra en múltiples pasos: selección de proveedor, agregado dinámico de ítems con búsqueda de insumos, cantidad, precio unitario, cálculo automático de subtotales y total general. Módulo de registro de recepciones (GoodsReceipt) vinculado a órdenes específicas, permitiendo recepción parcial o total de ítems con validación de cantidades. Indicadores visuales de estado con badges coloreados según estado. Tracking visual de progreso de recepciones con progress bars animadas. Integración completa con backend. Pruebas exhaustivas de flujo completo de compra.

### 20. F5: Módulo de Campos y Parcelas con mapas interactivos GeoJSON
  - **Inicio:** 19/10/2025
  - **Fin:** 15/11/2025
  - **Duración:** 4 semanas
  - **Descripción:** Desarrollo de módulos Fields y Plots con visualización geoespacial avanzada usando Deck.gl. Implementación de InteractiveMap component con capas de Deck.gl (GeoJsonLayer, PolygonLayer) para renderizado eficiente de polígonos GeoJSON de campos y parcelas. Vista de lista de campos con cards mostrando nombre, área total (hectáreas), cantidad de parcelas asociadas, y botón de ver en mapa. Vista de detalle de campo con mapa interactivo fullscreen mostrando todas sus parcelas con colores diferenciados y tooltips informativos al hover. Herramienta de edición avanzada PlotsEditor que permite dibujar nuevos polígonos, editar vértices de polígonos existentes, eliminar parcelas, y validar geometrías. Integración con Mapbox GL JS o OpenStreetMap (Leaflet) para capa base de mapa. Selección interactiva de parcelas con highlighting y panel lateral de información. Formularios de creación/edición de campos y parcelas con validación de geometrías (no auto-intersección, área mínima). Cálculo automático de área de polígonos. Sistema de zoom y pan con controles intuitivos. Responsive para uso en tablets.

### 21. F6: Módulo de Órdenes de Trabajo para planificación (Rol: Capataz)
  - **Inicio:** 09/11/2025
  - **Fin:** 18/11/2025
  - **Duración:** 1.5 semanas
  - **Descripción:** Implementación del módulo WorkOrders orientado al rol Capataz para planificación de tareas agrícolas. Vista de planificador de órdenes con visualización de calendario semanal/mensual (FullCalendar o similar) o tabla Kanban de trabajo. Formulario de creación de orden de trabajo con selección inteligente de parcela (autocompletado que filtra solo parcelas de campos gestionados por el capataz autenticado), fecha programada con date picker, tipo de tarea (select con opciones: riego, fertilización, poda, cosecha, mantenimiento), descripción detallada, y asignación a operario específico (select de usuarios con rol OPERARIO). Vista de listado de órdenes con filtros por estado (PENDING/IN_PROGRESS/COMPLETED/CANCELLED), rango de fechas, parcela, operario asignado. Vista de detalle con timeline de actividades asociadas ejecutadas. Dashboard con métricas: órdenes pendientes vs. completadas, órdenes vencidas con alertas rojas. Notificaciones visuales de órdenes vencidas o próximas a vencer. Autorización estricta: solo capataces y admins pueden acceder al módulo. Integración completa con sistema de autorización por campos gestionados del backend. Pruebas con usuarios de diferentes roles.

### 22. F7: Módulo de Actividades para registro de ejecución (Rol: Operario)
  - **Inicio:** 16/11/2025
  - **Fin:** 21/11/2025
  - **Duración:** 6 días
  - **Descripción:** Desarrollo del módulo Activities orientado al rol Operario para registro de actividades ejecutadas en campo. Vista de dashboard del operario (ActivitiesDashboard) mostrando órdenes de trabajo asignadas al operario autenticado, organizadas por fecha y estado. Formulario simplificado de registro de actividad con campos: fecha y hora real de ejecución (datetime picker), estado (select: completada/en progreso), observaciones de campo (textarea), y opción de adjuntar registro fotográfico (upload de imágenes). Submódulo de InputUsage integrado en el formulario para registrar insumos utilizados: búsqueda y selección de insumo con autocompletado, cantidad numérica, unidad de medida (select). Validación de stock disponible en frontend antes de enviar. Vista de listado de órdenes asignadas (ActivitiesListPage) con filtros por estado y fecha. Vista de historial de actividades completadas por el operario. Interfaz simplificada y optimizada para uso móvil y tablets en el campo (botones grandes, inputs accesibles). Modo offline básico para registrar actividades sin conexión (localStorage, sincronización posterior). Integración con backend para crear/actualizar actividades.

### 23. F8: Módulo de Lotes de Cosecha con inventario visual
  - **Inicio:** 22/11/2025
  - **Fin:** 25/11/2025
  - **Duración:** 4 días
  - **Descripción:** Implementación del módulo HarvestLots para gestión de inventario de producción. Vista de listado de lotes con cards visuales mostrando variedad de nuez (Chandler/Serr/etc.), cantidad en kg, fecha de cosecha, estado actual (badge coloreado), y ubicación de almacenamiento. Filtros dinámicos por estado (en almacén, asignado, enviado), variedad (multi-select), y rango de fechas de cosecha. Formulario de creación de lote de cosecha con selección múltiple de parcelas de origen (multi-select con búsqueda), variedad (select), cantidad total cosechada en kg (input numérico), fecha de cosecha (date picker), estado de calidad (select: premium/estándar/descarte), y ubicación de almacenamiento (input texto). Vista de detalle de lote con trazabilidad completa: mapa mostrando parcelas de origen, lista de actividades de cosecha asociadas con fecha y operario. Indicadores visuales de stock: cantidad disponible vs. cantidad asignada a ventas con progress bar. Dashboard de inventario con gráficos interactivos: cantidades por variedad (pie chart), evolución de inventario en el tiempo (line chart). Integración con backend.

### 24. F9: Módulo de Ventas con asignación de lotes
  - **Inicio:** 26/11/2025
  - **Fin:** 27/11/2025
  - **Duración:** 2 días
  - **Descripción:** Desarrollo del módulo Sales para gestión de órdenes de venta. Vista de listado de ventas con DataTable filtrable por cliente (autocompletado), estado (PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED), y rango de fechas. Formulario de creación de orden de venta multi-paso: selección de cliente, agregado dinámico de ítems con selección de variedad, cantidad en kg, precio por kg, asignación automática o manual de lotes de cosecha disponibles para cada ítem con validación de stock en tiempo real. Cálculo automático de subtotales por ítem y total general de la venta. Vista de detalle de venta con información completa: datos del cliente, lista de ítems vendidos, lotes asignados a cada ítem con código de lote y cantidad. Estados visuales con badges coloreados. Botones de acciones: confirmar venta, cancelar venta (con confirmación). Integración con backend.

### 25. F10: Módulo de Envíos con tracking de entregas
  - **Inicio:** 28/11/2025
  - **Fin:** 29/11/2025
  - **Duración:** 2 días
  - **Descripción:** Implementación del módulo Shipments para gestión de despachos logísticos. Vista de listado de envíos con DataTable mostrando número de envío, cliente destino, estado de entrega (badge), fecha de envío, y fecha estimada de entrega. Filtros por estado (PREPARING/IN_TRANSIT/DELIVERED) y rango de fechas. Formulario de creación de envío vinculado a orden de venta específica (select con búsqueda de ventas confirmadas), selección de lotes específicos a enviar con cantidades (validación de cantidades vendidas), información de transporte (input: empresa transportista, nombre del conductor), número de guía de seguimiento (input texto), fecha de envío (date picker), y fecha estimada de entrega (date picker). Vista de detalle con timeline visual de estados: preparando → en tránsito → entregado, cada uno con fecha y hora. Botón de actualización de estado de envío con modal para registrar fecha real de entrega. Integración automática con ventas: al crear envío, marcar venta como enviada. Dashboard de envíos en tránsito con alertas de retrasos. Integración con backend.

### 26. F11: Módulo de Reportes con visualizaciones y gráficos
  - **Inicio:** 29/11/2025
  - **Fin:** 30/11/2025
  - **Duración:** 2 días
  - **Descripción:** Desarrollo del módulo Reports con visualizaciones interactivas usando Chart.js o Recharts. Dashboard gerencial con KPIs principales en cards: producción total por variedad (kg), inventario actual de lotes (kg y cantidad de lotes), resumen de ventas del mes (total en $, cantidad vendida), y uso destacado de insumos (top 5 más usados). Páginas de reportes específicos: producción por campo/período con gráficos de barras comparativos, uso de insumos por tipo con gráficos de torta mostrando distribución, ventas en el tiempo con gráficos de líneas de tendencia, inventario actual con tablas detalladas y cards de resumen. Filtros dinámicos y flexibles por rango de fechas (date range picker), campos específicos (multi-select), y clientes (multi-select). Botones de exportación de reportes a PDF (react-pdf) o CSV para análisis externo. Integración con endpoints de reportes del backend. Diseño responsivo para visualización en diferentes dispositivos.

### 27. F12: Módulo de trazabilidad E2E con visualización de flujo
  - **Descripción:** Implementación de módulo de trazabilidad completa con visualización tipo flowchart interactivo (ReactFlow o similar). Buscador de lotes de cosecha que muestra flujo visual completo: origen (parcelas, actividades de cosecha, insumos utilizados en cultivo), destino (órdenes de venta asignadas, envíos realizados, clientes finales). Visualización gráfica con nodos interactivos clicables para expandir información. Vista inversa: dado un envío, mostrar toda la cadena de trazabilidad hacia atrás hasta las parcelas. Integración con endpoints E2E del backend. Interfaz para cumplimiento de normativas de trazabilidad alimentaria y auditorías.

### 28. F13: Empaquetado multiplataforma con Electron y Capacitor
  - **Descripción:** Configuración y empaquetado de la aplicación para múltiples plataformas. Setup de Electron para compilar aplicación de escritorio para Windows, macOS, Linux con instaladores nativos. Configuración de Capacitor para compilar aplicación móvil nativa para Android e iOS. Ajustes específicos de cada plataforma: íconos personalizados, splash screens, permisos de sistema (cámara para fotos en actividades, ubicación GPS). Pruebas de funcionalidad en cada plataforma target. Generación de instaladores (EXE, DMG, DEB) y APKs/IPAs firmados.

---

## Fase Final: Integración y Despliegue

### 29. Pruebas End-to-End integrales, corrección de bugs y preparación de entrega
  - **Inicio:** 29/11/2025
  - **Fin:** 30/11/2025
  - **Duración:** 2 días
  - **Descripción:** Fase intensiva de pruebas integrales del sistema completo una vez finalizado el desarrollo de todos los módulos. Ejecución de tests End-to-End con Playwright o Cypress para validar flujos críticos completos: proceso de autenticación con diferentes roles, flujo completo de compra (crear orden → registrar recepción parcial → completar recepción), flujo de planificación y ejecución (Capataz crea orden de trabajo → Operario registra actividad con uso de insumos → validar actualización de stock), flujo de producción y comercialización (crear lote de cosecha vinculado a actividades → crear venta asignando lotes → crear envío → marcar como entregado). Pruebas exhaustivas de autorización por rol: verificar que Capataz solo accede a campos gestionados asignados, que Operario solo ve órdenes de trabajo asignadas a él, que filtros automáticos por managedFields funcionan correctamente en todos los endpoints. Pruebas de integridad de datos: validar que transacciones de base de datos mantienen consistencia, que cálculos automáticos son correctos (cantidades recibidas, stock disponible, totales de venta). Testing cross-browser exhaustivo en navegadores principales (Chrome, Firefox, Edge, Safari). Validación de responsividad en dispositivos móviles y tablets reales. Pruebas de carga básicas para verificar rendimiento con volúmenes moderados de datos. Identificación y corrección de bugs críticos y de alta prioridad. Testing de seguridad básico: validar que endpoints protegidos rechazan accesos sin autenticación, que roles se respetan estrictamente. Limpieza final de código: eliminación de console.logs de desarrollo, comentarios obsoletos, código muerto. Verificación de variables de entorno y documentación de configuración. Preparación de documentación técnica de instalación, configuración y despliegue. Elaboración de manual de usuario básico con capturas de pantalla para el cliente. Generación de build de producción optimizado del frontend con minificación y tree-shaking. Configuración de entorno de producción o staging. Entrega de accesos, credenciales y documentación completa al cliente.
