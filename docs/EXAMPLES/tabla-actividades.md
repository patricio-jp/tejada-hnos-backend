Fase Inicial: Planificación y Configuración (2 Semanas)

| Proceso | Descripción del proceso | Duración |
| --- | --- | --- |
| 1. Reuniones e Ing. de Requisitos | Reuniones con el cliente para definir requisitos funcionales, actores, casos de uso y alcance. | 3 días |
| 2. Diseño de Arquitectura | Diseño de arquitectura en capas (Backend) y SPA (Frontend). Selección de stack tecnológico (Node, React, Postgres). Creación de DER inicial con 19 entidades. | 3 días |
| 3. Configuración de Entorno | Configuración de repositorios Git, proyectos base (Node/TS, React/TS), PostgreSQL, y herramientas de linting (ESLint, Prettier). | 3 días |


Fase de Desarrollo Backend
| Tarea (Código) | Descripción del proceso | Duración |
| --- | --- | --- |
| B1 | Implementación de 19 entidades TypeORM, DTOs y validaciones class-validator. | 7 días |
| B2 | Sistema de autenticación JWT, roles (ADMIN, CAPATAZ, OPERARIO) y middleware de autorización por campos gestionados. | 6 días |
| B3 | Endpoints CRUD para entidades maestras (Variety, Customer, Supplier, Input). | 3 días |
| B4 | Lógica transaccional de Compras: PurchaseOrder, GoodsReceipt y GoodsReceiptDetail. Cálculo de Costo Promedio Ponderado. | 6 días |
| B5 | Endpoints CRUD para Fields y Plots con almacenamiento de geometrías GeoJSON. | 4 días |
| B6 | Endpoints CRUD para WorkOrder (Órdenes de Trabajo) con lógica de permisos por rol. | 3 días |
| B7 | Lógica transaccional de Activities: registro de InputUsage y descuento de stock. | 5 días |
| B8 | Sistema de HarvestLot (Lotes de Cosecha) con estados (PENDIENTE, EN_STOCK). | 4 días |
| B9 | Lógica transaccional de Ventas: SalesOrder y asignación de lotes. | 4 días |
| B10 | Lógica transaccional de Envíos (Shipment): control de parciales (quantityShipped) y descuento de HarvestLot. | 4 días |
| B11 | Endpoints de Reportes: cálculo de rentabilidad (Costos vs. Ingresos). | 3 días |
| B12 | Endpoint de trazabilidad End-to-End (E2E). | 2 días |


Fase de Desarrollo Frontend
| Tarea (Código) | Descripción del proceso | Duración |
| --- | --- | --- |
| F1 | Sistema de diseño: configuración de Tailwind, Shadcn/UI y componentes base (Navbar, Sidebar, etc.). | 3 días |
| F2 | Autenticación y Ruteo: AuthContext, páginas de Login/Register, y ruteo protegido por roles. | 3 días |
| F3 | Interfaces CRUD para maestros (Variety, Customer, Supplier, Input) usando TanStack Table, React Hook Form y Zod. | 3 días |
| F4 | Módulo de Compras: UI para crear OC, registrar GoodsReceipt parciales y ver stock actualizado. | 7 días |
| F5 | Módulo de Campos y Parcelas: Mapa interactivo (Deck.gl) con herramientas para dibujar y editar polígonos GeoJSON. | 13 días |
| F6 | Módulo de Órdenes de Trabajo (Capataz): UI de planificación, calendario/Kanban, y asignación de tareas a operarios. | 5 días |
| F7 | Módulo de Actividades (Operario): UI móvil para registrar Activities y consumo de Input (con validación de stock). | 4 días |
| F8 | Módulo de Lotes de Cosecha: UI para registrar peso bruto (Cosecha) y procesar (Peso Neto, Calibre). | 3 días |
| F9 | Módulo de Ventas: UI para crear SalesOrder y ver estado de líneas (Pendiente vs. Enviado). | 3 días |
| F10 | Módulo de Envíos: UI de "Picking" para seleccionar HarvestLots (EN_STOCK) y cumplir con SalesOrder parciales. | 3 días |
| F11 | Módulo de Reportes: Dashboard con gráficos (Chart.js/Recharts) y reportes de rentabilidad. | 3 días |
| F12 | Módulo de Trazabilidad: Visualización del flujo E2E (ReactFlow). | Incluido en F11 |
| F13 | Empaquetado multiplataforma con Electron y Capacitor. | Incluido en T2 |


Fase Final
| Tarea (Código) | Descripción del proceso | Duración |
| --- | --- | --- |
| T1 | Integración E2E y Testing: pruebas con Postman/Playwright, corrección de bugs y ajustes finales. | 4 días |
| T2 | Empaquetado y Despliegue: configuración de Electron/Capacitor y deploy de backend. | 2 días |
| T3 | Documentación final: guías de uso, especificaciones técnicas y README. | 2 días |

