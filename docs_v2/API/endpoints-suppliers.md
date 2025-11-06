# 🏭 API - Proveedores

## Índice
- [Endpoints](#endpoints)
  - [GET /suppliers](#get-suppliers)
  - [GET /suppliers/:id](#get-suppliersid)
  - [POST /suppliers](#post-suppliers)
  - [PUT /suppliers/:id](#put-suppliersid)
  - [DELETE /suppliers/:id](#delete-suppliersid)
- [Permisos](#permisos)
- [Ejemplos Completos](#ejemplos-completos)

---

## Endpoints

### GET /suppliers

Listar todos los proveedores.

**URL:** `/suppliers`

**Método:** `GET`

**Autorización:** Bearer token (ADMIN, CAPATAZ)

**Query Parameters:**
- `search` (string, optional) - Buscar por nombre
- `page` (number, optional) - Número de página (default: 1)
- `limit` (number, optional) - Resultados por página (default: 10)

**Request:**
```
GET /suppliers
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "supplier-uuid-1",
      "name": "Proveedor García",
      "contactName": "Juan García",
      "email": "juan@proveedorgarcia.com",
      "phone": "+54 261 123-4567",
      "address": "Calle Principal 123",
      "city": "Mendoza",
      "taxId": "20-12345678-9",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    },
    {
      "id": "supplier-uuid-2",
      "name": "Nueces del Sur SA",
      "contactName": "María Pérez",
      "email": "maria@nuecesdelsur.com",
      "phone": "+54 261 987-6543",
      "address": "Av. San Martín 456",
      "city": "San Rafael",
      "taxId": "30-87654321-2",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

**Request with search:**
```
GET /suppliers?search=García
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "supplier-uuid-1",
      "name": "Proveedor García",
      "contactName": "Juan García",
      "email": "juan@proveedorgarcia.com",
      "phone": "+54 261 123-4567",
      "address": "Calle Principal 123",
      "city": "Mendoza",
      "taxId": "20-12345678-9",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

**cURL:**
```bash
# Listar todos
curl -X GET http://localhost:3000/suppliers \
  -H "Authorization: Bearer {token}"

# Buscar
curl -X GET "http://localhost:3000/suppliers?search=García" \
  -H "Authorization: Bearer {token}"

# Con paginación
curl -X GET "http://localhost:3000/suppliers?page=1&limit=5" \
  -H "Authorization: Bearer {token}"
```

---

**TypeScript Client:**
```typescript
const getSuppliers = async (filters?: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const url = `/suppliers${params.toString() ? '?' + params.toString() : ''}`;
  
  return apiClient.get(url);
};

// Uso
const allSuppliers = await getSuppliers();
const searchResults = await getSuppliers({ search: 'García' });
```

---

### GET /suppliers/:id

Obtener un proveedor por ID con sus órdenes de compra.

**URL:** `/suppliers/:id`

**Método:** `GET`

**Autorización:** Bearer token (ADMIN, CAPATAZ)

**Request:**
```
GET /suppliers/supplier-uuid-1
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "supplier-uuid-1",
  "name": "Proveedor García",
  "contactName": "Juan García",
  "email": "juan@proveedorgarcia.com",
  "phone": "+54 261 123-4567",
  "address": "Calle Principal 123",
  "city": "Mendoza",
  "taxId": "20-12345678-9",
  "purchaseOrders": [
    {
      "id": "po-uuid-1",
      "orderNumber": "PO-2025-001",
      "orderDate": "2025-01-10",
      "status": "DELIVERED",
      "totalAmount": 10000.00
    },
    {
      "id": "po-uuid-2",
      "orderNumber": "PO-2025-015",
      "orderDate": "2025-02-01",
      "status": "PENDING",
      "totalAmount": 15000.00
    }
  ],
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-10T08:00:00.000Z"
}
```

---

**Response (404) - No encontrado:**
```json
{
  "statusCode": 404,
  "message": "Proveedor no encontrado",
  "error": "Not Found"
}
```

---

**cURL:**
```bash
curl -X GET http://localhost:3000/suppliers/supplier-uuid-1 \
  -H "Authorization: Bearer {token}"
```

---

### POST /suppliers

Crear un nuevo proveedor.

**URL:** `/suppliers`

**Método:** `POST`

**Autorización:** Bearer token (ADMIN)

**Body:**
```json
{
  "name": "Nuevo Proveedor SA",
  "contactName": "Carlos López",
  "email": "carlos@nuevoproveedor.com",
  "phone": "+54 261 555-1234",
  "address": "Av. Las Heras 789",
  "city": "Mendoza",
  "taxId": "30-99887766-5"
}
```

**Validaciones:**
- `name` (string, required, min: 2, unique)
- `contactName` (string, required)
- `email` (string, optional, email)
- `phone` (string, optional)
- `address` (string, optional)
- `city` (string, optional)
- `taxId` (string, optional, unique)

**Response (201) - Success:**
```json
{
  "id": "new-supplier-uuid",
  "name": "Nuevo Proveedor SA",
  "contactName": "Carlos López",
  "email": "carlos@nuevoproveedor.com",
  "phone": "+54 261 555-1234",
  "address": "Av. Las Heras 789",
  "city": "Mendoza",
  "taxId": "30-99887766-5",
  "createdAt": "2025-02-01T10:00:00.000Z",
  "updatedAt": "2025-02-01T10:00:00.000Z"
}
```

---

**Response (400) - Nombre duplicado:**
```json
{
  "statusCode": 400,
  "message": "Ya existe un proveedor con ese nombre",
  "error": "Bad Request"
}
```

---

**Response (403) - No es ADMIN:**
```json
{
  "statusCode": 403,
  "message": "No tiene permisos para crear proveedores",
  "error": "Forbidden"
}
```

---

**cURL:**
```bash
curl -X POST http://localhost:3000/suppliers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Proveedor SA",
    "contactName": "Carlos López",
    "email": "carlos@nuevoproveedor.com",
    "phone": "+54 261 555-1234",
    "address": "Av. Las Heras 789",
    "city": "Mendoza",
    "taxId": "30-99887766-5"
  }'
```

---

**TypeScript Client:**
```typescript
interface CreateSupplierDto {
  name: string;
  contactName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
}

const createSupplier = async (data: CreateSupplierDto) => {
  return apiClient.post('/suppliers', data);
};

// Uso
const newSupplier = await createSupplier({
  name: 'Nuevo Proveedor SA',
  contactName: 'Carlos López',
  email: 'carlos@nuevoproveedor.com',
  phone: '+54 261 555-1234',
  address: 'Av. Las Heras 789',
  city: 'Mendoza',
  taxId: '30-99887766-5'
});

console.log('✅ Proveedor creado:', newSupplier.id);
```

---

### PUT /suppliers/:id

Actualizar un proveedor existente.

**URL:** `/suppliers/:id`

**Método:** `PUT`

**Autorización:** Bearer token (ADMIN)

**Body:**
```json
{
  "contactName": "Juan García Jr.",
  "email": "juanjr@proveedorgarcia.com",
  "phone": "+54 261 123-9999"
}
```

**Validaciones:**
- `name` (string, optional, min: 2, unique)
- `contactName` (string, optional)
- `email` (string, optional, email)
- `phone` (string, optional)
- `address` (string, optional)
- `city` (string, optional)
- `taxId` (string, optional, unique)

**Request:**
```
PUT /suppliers/supplier-uuid-1
Authorization: Bearer {token}
Content-Type: application/json

{
  "contactName": "Juan García Jr.",
  "email": "juanjr@proveedorgarcia.com",
  "phone": "+54 261 123-9999"
}
```

**Response (200) - Success:**
```json
{
  "id": "supplier-uuid-1",
  "name": "Proveedor García",
  "contactName": "Juan García Jr.",
  "email": "juanjr@proveedorgarcia.com",
  "phone": "+54 261 123-9999",
  "address": "Calle Principal 123",
  "city": "Mendoza",
  "taxId": "20-12345678-9",
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2025-02-01T11:00:00.000Z"
}
```

---

**Response (404) - No encontrado:**
```json
{
  "statusCode": 404,
  "message": "Proveedor no encontrado",
  "error": "Not Found"
}
```

---

**cURL:**
```bash
curl -X PUT http://localhost:3000/suppliers/supplier-uuid-1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "Juan García Jr.",
    "email": "juanjr@proveedorgarcia.com",
    "phone": "+54 261 123-9999"
  }'
```

---

**TypeScript Client:**
```typescript
interface UpdateSupplierDto {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
}

const updateSupplier = async (supplierId: string, data: UpdateSupplierDto) => {
  return apiClient.put(`/suppliers/${supplierId}`, data);
};

// Uso
await updateSupplier('supplier-uuid-1', {
  contactName: 'Juan García Jr.',
  email: 'juanjr@proveedorgarcia.com',
  phone: '+54 261 123-9999'
});

console.log('✅ Proveedor actualizado');
```

---

### DELETE /suppliers/:id

Eliminar un proveedor (soft delete).

**URL:** `/suppliers/:id`

**Método:** `DELETE`

**Autorización:** Bearer token (ADMIN)

**Request:**
```
DELETE /suppliers/supplier-uuid-2
Authorization: Bearer {token}
```

**Response (200) - Success:**
```json
{
  "message": "Proveedor eliminado exitosamente",
  "id": "supplier-uuid-2"
}
```

---

**Response (400) - Tiene órdenes de compra activas:**
```json
{
  "statusCode": 400,
  "message": "No se puede eliminar el proveedor porque tiene órdenes de compra asociadas",
  "error": "Bad Request"
}
```

---

**Response (404) - No encontrado:**
```json
{
  "statusCode": 404,
  "message": "Proveedor no encontrado",
  "error": "Not Found"
}
```

---

**cURL:**
```bash
curl -X DELETE http://localhost:3000/suppliers/supplier-uuid-2 \
  -H "Authorization: Bearer {token}"
```

---

**TypeScript Client:**
```typescript
const deleteSupplier = async (supplierId: string) => {
  return apiClient.delete(`/suppliers/${supplierId}`);
};

// Uso
try {
  await deleteSupplier('supplier-uuid-2');
  console.log('✅ Proveedor eliminado');
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

---

## Permisos

| Endpoint | ADMIN | CAPATAZ | OPERARIO |
|----------|-------|---------|----------|
| GET /suppliers | ✅ | ✅ | ❌ |
| GET /suppliers/:id | ✅ | ✅ | ❌ |
| POST /suppliers | ✅ | ❌ | ❌ |
| PUT /suppliers/:id | ✅ | ❌ | ❌ |
| DELETE /suppliers/:id | ✅ | ❌ | ❌ |

---

## Ejemplos Completos

### Flujo 1: Gestión Completa de Proveedores

```typescript
/**
 * CRUD completo de proveedores
 */
class SupplierService {
  // Crear proveedor
  async createSupplier(data: CreateSupplierDto) {
    const supplier = await apiClient.post('/suppliers', data);
    console.log('✅ Proveedor creado:', supplier.name);
    return supplier;
  }
  
  // Listar proveedores
  async getAllSuppliers() {
    const response = await apiClient.get('/suppliers');
    return response.data;
  }
  
  // Buscar proveedores
  async searchSuppliers(query: string) {
    const response = await apiClient.get(`/suppliers?search=${query}`);
    return response.data;
  }
  
  // Obtener un proveedor con sus órdenes
  async getSupplierWithOrders(supplierId: string) {
    return apiClient.get(`/suppliers/${supplierId}`);
  }
  
  // Actualizar proveedor
  async updateSupplier(supplierId: string, data: UpdateSupplierDto) {
    const updated = await apiClient.put(`/suppliers/${supplierId}`, data);
    console.log('✅ Proveedor actualizado');
    return updated;
  }
  
  // Eliminar proveedor
  async deleteSupplier(supplierId: string) {
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      console.log('✅ Proveedor eliminado');
      return true;
    } catch (error: any) {
      if (error.message.includes('órdenes de compra')) {
        console.error('❌ No se puede eliminar: tiene órdenes asociadas');
      }
      throw error;
    }
  }
}

const supplierService = new SupplierService();
export default supplierService;

// Uso
const newSupplier = await supplierService.createSupplier({
  name: 'Proveedor Nuevo',
  contactName: 'Carlos López',
  email: 'carlos@nuevo.com',
  phone: '+54 261 555-1234',
  city: 'Mendoza'
});

const suppliers = await supplierService.getAllSuppliers();
console.log(`Total proveedores: ${suppliers.length}`);

const search = await supplierService.searchSuppliers('García');
console.log('Resultados:', search);

const details = await supplierService.getSupplierWithOrders('supplier-uuid-1');
console.log('Órdenes de compra:', details.purchaseOrders.length);
```

---

### Flujo 2: Selección de Proveedor para Orden de Compra

```typescript
/**
 * Selector de proveedores para crear orden de compra
 */
const selectSupplierForPurchase = async () => {
  // Listar proveedores activos
  const response = await apiClient.get('/suppliers');
  const suppliers = response.data;
  
  console.log('Proveedores disponibles:');
  suppliers.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} - ${s.city} - ${s.phone}`);
  });
  
  // Usuario selecciona (en frontend sería un dropdown/select)
  const selectedIndex = 0; // Ejemplo: primer proveedor
  const selectedSupplier = suppliers[selectedIndex];
  
  console.log('Proveedor seleccionado:', selectedSupplier.name);
  
  return selectedSupplier.id;
};

// Integración con creación de orden de compra
const createPurchaseOrderWithSupplier = async () => {
  // Seleccionar proveedor
  const supplierId = await selectSupplierForPurchase();
  
  // Crear orden de compra
  const purchaseOrder = await apiClient.post('/purchase-orders', {
    supplierId,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '2025-02-15',
    details: [
      {
        caliber: 'CHANDLER',
        quantity: 500,
        unitPrice: 20.00
      }
    ]
  });
  
  console.log('✅ Orden de compra creada:', purchaseOrder.orderNumber);
};
```

---

### Flujo 3: React Component - Supplier List

```typescript
import React, { useState, useEffect } from 'react';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
}

function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSuppliers();
  }, [search]);
  
  const loadSuppliers = async () => {
    setLoading(true);
    
    try {
      const url = search ? `/suppliers?search=${search}` : '/suppliers';
      const response = await apiClient.get(url);
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (supplierId: string, supplierName: string) => {
    if (!confirm(`¿Eliminar proveedor "${supplierName}"?`)) return;
    
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      loadSuppliers();
    } catch (error: any) {
      if (error.message.includes('órdenes de compra')) {
        alert('No se puede eliminar: tiene órdenes de compra asociadas');
      } else {
        alert('Error al eliminar proveedor');
      }
    }
  };
  
  if (loading) return <div>Cargando proveedores...</div>;
  
  return (
    <div>
      <h1>Proveedores</h1>
      
      <div>
        <input
          type="text"
          placeholder="Buscar proveedor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Ciudad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map(supplier => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.contactName}</td>
              <td>{supplier.email || '-'}</td>
              <td>{supplier.phone || '-'}</td>
              <td>{supplier.city || '-'}</td>
              <td>
                <button onClick={() => window.location.href = `/suppliers/${supplier.id}`}>
                  Ver detalles
                </button>
                <button onClick={() => handleDelete(supplier.id, supplier.name)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {suppliers.length === 0 && (
        <p>No se encontraron proveedores</p>
      )}
    </div>
  );
}

export default SupplierList;
```

---

### Flujo 4: Supplier Form Component

```typescript
import React, { useState } from 'react';

interface SupplierFormData {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxId: string;
}

function SupplierForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    taxId: ''
  });
  
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleChange = (field: keyof SupplierFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    
    try {
      await apiClient.post('/suppliers', formData);
      alert('✅ Proveedor creado exitosamente');
      
      // Reset form
      setFormData({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        taxId: ''
      });
      
      onSuccess?.();
    } catch (error: any) {
      if (error.message.includes('nombre')) {
        setErrors(['Ya existe un proveedor con ese nombre']);
      } else {
        setErrors([error.message]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Nuevo Proveedor</h2>
      
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}
      
      <div>
        <label>Nombre *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Nombre de Contacto *</label>
        <input
          type="text"
          value={formData.contactName}
          onChange={e => handleChange('contactName', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
        />
      </div>
      
      <div>
        <label>Teléfono</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => handleChange('phone', e.target.value)}
        />
      </div>
      
      <div>
        <label>Dirección</label>
        <input
          type="text"
          value={formData.address}
          onChange={e => handleChange('address', e.target.value)}
        />
      </div>
      
      <div>
        <label>Ciudad</label>
        <input
          type="text"
          value={formData.city}
          onChange={e => handleChange('city', e.target.value)}
        />
      </div>
      
      <div>
        <label>CUIT/CUIL</label>
        <input
          type="text"
          value={formData.taxId}
          onChange={e => handleChange('taxId', e.target.value)}
          placeholder="20-12345678-9"
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Proveedor'}
      </button>
    </form>
  );
}

export default SupplierForm;
```

---

**Documentación relacionada:**
- [03-COMPRAS.md](../MODULOS/03-COMPRAS.md) - Módulo de compras completo
- [endpoints-purchase-orders.md](./endpoints-purchase-orders.md) - Órdenes de compra
- [endpoints-goods-receipts.md](./endpoints-goods-receipts.md) - Recepciones de mercadería
