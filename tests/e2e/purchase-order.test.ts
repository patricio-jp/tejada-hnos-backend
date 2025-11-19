import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser } from '../helpers/auth.helper';
import { UserRole, PurchaseOrderStatus } from '@/enums';
import { setupPurchaseScenario, createTestSupplier } from '../helpers/fixtures.helper';

describe('E2E: Purchase Orders', () => {
  let app: Express;
  let dataSource: DataSource;
  let admin: TestUser;
  let capataz: TestUser;
  let operario: TestUser;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = createTestApp(dataSource);
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
    const users = await createStandardTestUsers(dataSource);
    admin = users.admin;
    capataz = users.capataz;
    operario = users.operario;
  });

describe('Purchase Orders - POST /purchase-orders', () => {
  it('should allow ADMIN to create a purchase order', async () => {
    const { supplier, fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: supplier.id,
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 100,
            unitPrice: 5.50,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe(PurchaseOrderStatus.PENDIENTE);
    expect(res.body.data.totalAmount).toBe(550); // 100 * 5.50
  });

  it('should allow CAPATAZ to create a purchase order', async () => {
    const { supplier, pesticideInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${capataz.token}`)
      .send({
        supplierId: supplier.id,
        details: [
          {
            inputId: pesticideInput.id,
            quantity: 50,
            unitPrice: 12.00,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(600); // 50 * 12.00
  });

  it('should NOT allow OPERARIO to create a purchase order', async () => {
    const { supplier, fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${operario.token}`)
      .send({
        supplierId: supplier.id,
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 100,
            unitPrice: 5.50,
          },
        ],
      });

    expect(res.status).toBe(403);
  });

  it('should fail if supplierId is missing', async () => {
    const { fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 100,
            unitPrice: 5.50,
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('should fail if details array is empty', async () => {
    const { supplier } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: supplier.id,
        details: [],
      });

    expect(res.status).toBe(400);
  });

  it('should fail if supplier does not exist', async () => {
    const { fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 100,
            unitPrice: 5.50,
          },
        ],
      });

    expect(res.status).toBe(404);
  });

  it('should fail if input does not exist', async () => {
    const { supplier } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: supplier.id,
        details: [
          {
            inputId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
            quantity: 100,
            unitPrice: 5.50,
          },
        ],
      });

    expect(res.status).toBe(404);
  });

  it('should calculate totalAmount correctly with multiple details', async () => {
    const { supplier, fertilizerInput, pesticideInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: supplier.id,
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 100,
            unitPrice: 5.50,
          },
          {
            inputId: pesticideInput.id,
            quantity: 50,
            unitPrice: 12.00,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalAmount).toBe(1150); // (100 * 5.50) + (50 * 12.00)
  });
});

describe('Purchase Orders - GET /purchase-orders', () => {
  it('should allow ADMIN to list all purchase orders', async () => {
    await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should allow CAPATAZ to list all purchase orders', async () => {
    const res = await request(app)
      .get('/purchase-orders')
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to list purchase orders', async () => {
    const res = await request(app)
      .get('/purchase-orders')
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });

  it('should include supplier and details relations', async () => {
    await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get('/purchase-orders')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    const order = res.body.data[0];
    expect(order).toHaveProperty('supplier');
    expect(order).toHaveProperty('details');
  });
});

describe('Purchase Orders - GET /purchase-orders/:id', () => {
  it('should allow ADMIN to get a purchase order by ID', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(purchaseOrder.id);
  });

  it('should allow CAPATAZ to get a purchase order by ID', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to get a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent purchase order', async () => {
    const res = await request(app)
      .get('/purchase-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await request(app)
      .get('/purchase-orders/invalid-uuid')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
  });
});

describe('Purchase Orders - PUT /purchase-orders/:id', () => {
  it('should allow ADMIN to update a PENDIENTE purchase order', async () => {
    const { purchaseOrder, fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 200,
            unitPrice: 6.00,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.totalAmount).toBe(1200); // 200 * 6.00
  });

  it('should allow CAPATAZ to update a PENDIENTE purchase order', async () => {
    const { purchaseOrder, pesticideInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${capataz.token}`)
      .send({
        details: [
          {
            inputId: pesticideInput.id,
            quantity: 75,
            unitPrice: 10.00,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.totalAmount).toBe(750);
  });

  it('should NOT allow OPERARIO to update a purchase order', async () => {
    const { purchaseOrder, fertilizerInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${operario.token}`)
      .send({
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 200,
            unitPrice: 6.00,
          },
        ],
      });

    expect(res.status).toBe(403);
  });

  it('should NOT allow updating an APROBADA purchase order', async () => {
    const { purchaseOrder, fertilizerInput } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 200,
            unitPrice: 6.00,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toContain('PENDIENTE');
  });

  it('should allow updating supplier in PENDIENTE order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);
    const newSupplier = await createTestSupplier(dataSource, {
      name: 'Nuevo Proveedor S.A.',
      contactEmail: 'nuevo@proveedor.cl',
    });

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        supplierId: newSupplier.id,
        details: purchaseOrder.details.map((d: any) => ({
          inputId: d.inputId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
        })),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.supplierId).toBe(newSupplier.id);
  });

  it('should recalculate totalAmount when updating details', async () => {
    const { purchaseOrder, fertilizerInput, pesticideInput } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .put(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        details: [
          {
            inputId: fertilizerInput.id,
            quantity: 300,
            unitPrice: 5.00,
          },
          {
            inputId: pesticideInput.id,
            quantity: 100,
            unitPrice: 15.00,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.totalAmount).toBe(3000); // (300 * 5) + (100 * 15)
  });
});

describe('Purchase Orders - PATCH /purchase-orders/:id/status', () => {
  it('should allow ADMIN to update purchase order status', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: PurchaseOrderStatus.APROBADA,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PurchaseOrderStatus.APROBADA);
  });

  it('should NOT allow CAPATAZ to update purchase order status', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/status`)
      .set('Authorization', `Bearer ${capataz.token}`)
      .send({
        status: PurchaseOrderStatus.APROBADA,
      });

    expect(res.status).toBe(403);
  });

  it('should allow changing status from PENDIENTE to APROBADA', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: PurchaseOrderStatus.APROBADA,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PurchaseOrderStatus.APROBADA);
  });

  it('should allow changing status from PENDIENTE to CANCELADA', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: PurchaseOrderStatus.CANCELADA,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(PurchaseOrderStatus.CANCELADA);
  });

  it('should allow updating detail prices when changing status', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);
    //console.log('Purchase Order before status update:', purchaseOrder);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: PurchaseOrderStatus.APROBADA,
        details: purchaseOrder.details.map((d: any) => ({
          detailId: d.id,
          unitPrice: d.unitPrice + 1.00,
        })),
      });

    expect(res.status).toBe(200);
    // Verify totalAmount was recalculated
    expect(res.body.data.totalAmount).toBeGreaterThan(purchaseOrder.totalAmount);
  });
});

describe('Purchase Orders - GET /purchase-orders/:id/receipts', () => {
  it('should allow ADMIN to get receipts for a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}/receipts`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should allow CAPATAZ to get receipts', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}/receipts`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to get receipts', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}/receipts`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });
});

describe('Purchase Orders - DELETE /purchase-orders/:id', () => {
  it('should allow ADMIN to soft delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
  });

  it('should allow CAPATAZ to soft delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });
});

describe('Purchase Orders - PATCH /purchase-orders/:id/restore', () => {
  it('should allow ADMIN to restore a deleted purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    // First delete it
    await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    // Then restore
    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/restore`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
  });

  it('should allow CAPATAZ to restore a deleted purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${capataz.token}`);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/restore`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to restore a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    const res = await request(app)
      .patch(`/purchase-orders/${purchaseOrder.id}/restore`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });
});

describe('Purchase Orders - DELETE /purchase-orders/:id/permanent', () => {
  it('should allow ADMIN to permanently delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}/permanent`)
      .set('Authorization', `Bearer ${admin.token}`);

    console.log('Permanent delete response body:', res.body);

    expect(res.status).toBe(200);

    // Verify it's completely gone
    const getRes = await request(app)
      .get(`/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(getRes.status).toBe(404);
  });

  it('should NOT allow CAPATAZ to permanently delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}/permanent`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(403);
  });

  it('should NOT allow OPERARIO to permanently delete a purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource);

    const res = await request(app)
      .delete(`/purchase-orders/${purchaseOrder.id}/permanent`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });
});
});
