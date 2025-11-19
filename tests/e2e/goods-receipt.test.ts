import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser } from '../helpers/auth.helper';
import { Input } from '@/entities/input.entity';
import { PurchaseOrder } from '@/entities/purchase-order.entity';
import { UserRole, PurchaseOrderStatus } from '@/enums';
import { setupPurchaseScenario } from '../helpers/fixtures.helper';

describe('E2E: Goods Receipts', () => {
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

describe('Goods Receipts - POST /goods-receipts', () => {
  it('should allow ADMIN to create a goods receipt for APROBADA purchase order', async () => {
    const { purchaseOrder, fertilizerInput } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    // Get initial stock
    const inputRepository = dataSource.getRepository(Input);
    const initialInput = await inputRepository.findOne({ where: { id: fertilizerInput.id } });
    const initialStock = initialInput!.stock;

    const detail = purchaseOrder.details[0]!; // fertilizer detail

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');

    // Verify stock was updated
    const updatedInput = await inputRepository.findOne({ where: { id: fertilizerInput.id } });
    expect(updatedInput!.stock).toBe(initialStock + 100);
  });

  it('should allow CAPATAZ to create a goods receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${capataz.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    expect(res.status).toBe(201);
  });

  it('should NOT allow OPERARIO to create a goods receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${operario.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(403);
  });

  it('should NOT allow creating goods receipt for PENDIENTE purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(dataSource); // PENDIENTE by default

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('APROBADA');
  });

  it('should NOT allow creating goods receipt for CANCELADA purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.CANCELADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('should fail if purchaseOrderId is missing', async () => {
    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        details: [
          {
            purchaseOrderDetailId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(400);
  });

  it('should fail if details array is empty', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [],
      });

    expect(res.status).toBe(400);
  });

  it('should fail if purchase order does not exist', async () => {
    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
        details: [
          {
            purchaseOrderDetailId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(404);
  });

  it('should fail if receiving more than ordered quantity', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: detail.quantity + 100, // More than ordered
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('excede');
  });

  it('should update purchase order status to RECIBIDA_PARCIAL after partial receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: detail.quantity / 2, // Partial receipt
          },
        ],
      });

    expect(res.status).toBe(201);

    // Verify PO status was updated
    const poRepository = dataSource.getRepository(PurchaseOrder);
    const updatedPO = await poRepository.findOne({ where: { id: purchaseOrder.id } });
    expect(updatedPO!.status).toBe(PurchaseOrderStatus.RECIBIDA_PARCIAL);
  });

  it('should update purchase order status to RECIBIDA after full receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    // Receive all details completely
    const receiptPromises = purchaseOrder.details.map((detail: any) =>
      request(app)
        .post('/goods-receipts')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          purchaseOrderId: purchaseOrder.id,
          details: [
            {
              purchaseOrderDetailId: detail.id,
              quantityReceived: detail.quantity, // Full quantity
            },
          ],
        })
    );

    await Promise.all(receiptPromises);

    // Verify PO status was updated to RECIBIDA
    const poRepository = dataSource.getRepository(PurchaseOrder);
    const updatedPO = await poRepository.findOne({ where: { id: purchaseOrder.id } });
    expect(updatedPO!.status).toBe(PurchaseOrderStatus.RECIBIDA);
  });

  it('should calculate weighted average cost correctly', async () => {
    const { purchaseOrder, fertilizerInput } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const inputRepository = dataSource.getRepository(Input);
    const initialInput = await inputRepository.findOne({ where: { id: fertilizerInput.id } });
    const initialStock = initialInput!.stock;
    const initialCost = initialInput!.costPerUnit;

    const detail = purchaseOrder.details.find((d: any) => d.inputId === fertilizerInput.id)!;
    const receivedQty = 100;
    const unitPrice = detail.unitPrice;

    await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: receivedQty,
          },
        ],
      });

    // Calculate expected weighted average cost
    const expectedCost =
      ((initialStock * initialCost) + (receivedQty * unitPrice)) /
      (initialStock + receivedQty);

    const updatedInput = await inputRepository.findOne({ where: { id: fertilizerInput.id } });
    expect(updatedInput!.costPerUnit).toBeCloseTo(expectedCost, 2);
  });

  it('should allow multiple partial receipts', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const firstReceiptQty = Math.floor(detail.quantity / 3);

    // First receipt
    const res1 = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: firstReceiptQty,
          },
        ],
      });

    expect(res1.status).toBe(201);

    // Second receipt
    const res2 = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: firstReceiptQty,
          },
        ],
      });

    expect(res2.status).toBe(201);

    // Verify PO is still RECIBIDA_PARCIAL
    const poRepository = dataSource.getRepository(PurchaseOrder);
    const updatedPO = await poRepository.findOne({ where: { id: purchaseOrder.id } });
    expect(updatedPO!.status).toBe(PurchaseOrderStatus.RECIBIDA_PARCIAL);
  });

  it('should NOT allow receiving more than pending quantity after partial receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const firstReceiptQty = detail.quantity / 2;

    // First receipt
    await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: firstReceiptQty,
          },
        ],
      });

    // Try to receive more than remaining
    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: firstReceiptQty + 100, // More than remaining
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('excede');
  });

  it('should accept custom receivedDate', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const customDate = new Date('2024-01-15T10:00:00Z');

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        receivedDate: customDate.toISOString(),
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    expect(res.status).toBe(201);
    // Note: The API may adjust timezone, so we just verify the date part
    expect(res.body.data.receivedAt).toContain('2024-01-15');
  });

  it('should accept notes field', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        notes: 'Recepción con pequeño daño en embalaje',
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 100,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.notes).toBe('Recepción con pequeño daño en embalaje');
  });

  it('should allow receiving from RECIBIDA_PARCIAL purchase order', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;

    // First receipt to make it RECIBIDA_PARCIAL
    await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: detail.quantity / 2,
          },
        ],
      });

    // Second receipt from RECIBIDA_PARCIAL status
    const res = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: detail.quantity / 2,
          },
        ],
      });

    expect(res.status).toBe(201);
  });
});

describe('Goods Receipts - GET /goods-receipts', () => {
  it('should allow ADMIN to list all goods receipts', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    // Create a receipt first
    const detail = purchaseOrder.details[0]!;
    await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    const res = await request(app)
      .get('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should allow CAPATAZ to list goods receipts', async () => {
    const res = await request(app)
      .get('/goods-receipts')
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to list goods receipts', async () => {
    const res = await request(app)
      .get('/goods-receipts')
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });
});

describe('Goods Receipts - GET /goods-receipts/:id', () => {
  it('should allow ADMIN to get a goods receipt by ID', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const createRes = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    const receiptId = createRes.body.data.id;

    const res = await request(app)
      .get(`/goods-receipts/${receiptId}`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(receiptId);
  });

  it('should allow CAPATAZ to get a goods receipt by ID', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const createRes = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${capataz.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    const receiptId = createRes.body.data.id;

    const res = await request(app)
      .get(`/goods-receipts/${receiptId}`)
      .set('Authorization', `Bearer ${capataz.token}`);

    expect(res.status).toBe(200);
  });

  it('should NOT allow OPERARIO to get a goods receipt', async () => {
    const { purchaseOrder } = await setupPurchaseScenario(
      dataSource,
      PurchaseOrderStatus.APROBADA
    );

    const detail = purchaseOrder.details[0]!;
    const createRes = await request(app)
      .post('/goods-receipts')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        purchaseOrderId: purchaseOrder.id,
        details: [
          {
            purchaseOrderDetailId: detail.id,
            quantityReceived: 50,
          },
        ],
      });

    const receiptId = createRes.body.data.id;

    const res = await request(app)
      .get(`/goods-receipts/${receiptId}`)
      .set('Authorization', `Bearer ${operario.token}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent goods receipt', async () => {
    const res = await request(app)
      .get('/goods-receipts/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await request(app)
      .get('/goods-receipts/invalid-uuid')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
  });
});
});

