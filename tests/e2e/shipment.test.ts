import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser, createTestUser } from '../helpers/auth.helper';
import {
  setupSalesScenario,
  createTestHarvestLot,
  createTestSalesOrder,
} from '../helpers/fixtures.helper';
import { Shipment } from '@/entities/shipment.entity';
import { UserRole, HarvestLotStatus, WalnutCaliber, SalesOrderStatus } from '@/enums';

describe('E2E: Shipments Flow', () => {
  let app: Express;
  let dataSource: DataSource;
  let admin: TestUser;
  let capataz: TestUser;
  let capatazB: TestUser;
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

    capatazB = await createTestUser(dataSource, {
      email: 'capatazB@test.com',
      name: 'CapatazB',
      lastName: 'Test',
      role: UserRole.CAPATAZ,
      password: 'capatazB123',
      hourlyRate: 30,
    });
  });

  describe('POST /sales-orders/:salesOrderId/shipments - Create shipment', () => {
    it('should allow ADMIN to create a shipment for a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;
      const harvestLotId = scenario.inStockLot.id;

      // Act
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-001',
          notes: 'Primer envío de prueba',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: detailId,
              quantityTakenKg: 250,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.salesOrderId).toBe(salesOrderId);
      expect(response.body.data.trackingNumber).toBe('TRACK-001');
      expect(response.body.data.notes).toBe('Primer envío de prueba');
      expect(response.body.data.lotDetails).toHaveLength(1);
      expect(response.body.data.lotDetails[0].quantityTakenKg).toBe(250);
    });

    it('should allow CAPATAZ to create a shipment', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;
      const harvestLotId = scenario.inStockLot.id;

      // Act
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          trackingNumber: 'TRACK-002',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: detailId,
              quantityTakenKg: 200,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.salesOrderId).toBe(salesOrderId);
    });

    it('should create shipment with multiple lot details', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Create additional harvest lot
      const secondLot = await createTestHarvestLot(dataSource, {
        plotId: scenario.plot.id,
        harvestDate: new Date('2025-03-18'),
        lotCode: 'LOT-SECOND',
        varietyName: 'Serr',
        caliber: WalnutCaliber.JUMBO,
        grossWeightKg: 1000,
        netWeightKg: 850,
        status: HarvestLotStatus.EN_STOCK,
      });

      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;

      // Act
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-MULTI',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 300,
            },
            {
              harvestLotId: secondLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 200,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.lotDetails).toHaveLength(2);
    });

    it('should update harvest lot remainingNetWeightKg after shipment', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const harvestLotId = scenario.inStockLot.id;
      const initialRemainingWeight = 1600; // from setup

      // Act
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-003',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 400,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify harvest lot updated
      const harvestLotResponse = await request(app)
        .get(`/harvest-lots/${harvestLotId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(harvestLotResponse.body.data.remainingNetWeightKg).toBe(1200); // 1600 - 400
    });

    it('should update sales order detail quantityShipped after shipment', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;

      // Act
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-004',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 150,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify sales order detail updated
      const salesOrderResponse = await request(app)
        .get(`/sales-orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const detail = salesOrderResponse.body.data.details.find((d: any) => d.id === detailId);
      expect(detail.quantityShipped).toBe(150);
      expect(detail.quantityPending).toBe(350); // 500 - 150 (from setup)
    });

    it('should NOT allow shipment with quantity exceeding harvest lot stock', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      // inStockLot has 1600 kg remaining

      // Act
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-EXCEED',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 2000, // Exceeds available
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain('Stock insuficiente');
    });

    it('should NOT allow shipment from PENDIENTE_PROCESO harvest lot', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      // pendingLot is PENDIENTE_PROCESO

      // Act
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-PENDING',
          lotDetails: [
            {
              harvestLotId: scenario.pendingLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain('EN_STOCK');
    });

    it('should NOT allow OPERARIO to create a shipment', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);

      // Act
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          trackingNumber: 'TRACK-OP',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);

      // Act - Missing lotDetails
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-INVALID',
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should validate quantityTakenKg is positive', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);

      // Act
      const response = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-NEG',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 0,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should validate salesOrderId exists', async () => {
      // Arrange - Create valid lot and detail IDs
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Act - Use non-existent salesOrderId but valid harvestLotId and salesOrderDetailId
      const response = await request(app)
        .post('/sales-orders/00000000-0000-0000-0000-000000000000/shipments')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/sales-orders/some-id/shipments')
        .send({ lotDetails: [] });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /shipments - List all shipments', () => {
    it('should allow ADMIN to see all shipments', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Create a shipment
      await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-LIST-001',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 200,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get('/shipments')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('salesOrderId');
      expect(response.body.data[0]).toHaveProperty('trackingNumber');
    });

    it('should allow CAPATAZ to see all shipments', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          trackingNumber: 'TRACK-LIST-002',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 150,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get('/shipments')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should include related data (salesOrder, lotDetails)', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      const createResponse = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-RELATIONS',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get('/shipments')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      const shipment = response.body.data.find((s: any) => s.id === createResponse.body.data.id);
      expect(shipment).toBeDefined();
      expect(shipment).toHaveProperty('salesOrder');
      expect(shipment).toHaveProperty('lotDetails');
      expect(shipment.lotDetails).toHaveLength(1);
    });

    it('should NOT allow OPERARIO to list shipments', async () => {
      // Act
      const response = await request(app)
        .get('/shipments')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/shipments');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /shipments/:id - Get shipment by ID', () => {
    it('should allow ADMIN to get shipment by ID', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      const createResponse = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-GET-001',
          notes: 'Test notes',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 300,
            },
          ],
        });

      const shipmentId = createResponse.body.data.id;

      // Act
      const response = await request(app)
        .get(`/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(shipmentId);
      expect(response.body.data.trackingNumber).toBe('TRACK-GET-001');
      expect(response.body.data.notes).toBe('Test notes');
      expect(response.body.data.lotDetails).toHaveLength(1);
    });

    it('should allow CAPATAZ to get shipment by ID', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      const createResponse = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          trackingNumber: 'TRACK-GET-002',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 250,
            },
          ],
        });

      const shipmentId = createResponse.body.data.id;

      // Act
      const response = await request(app)
        .get(`/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(shipmentId);
    });

    it('should include full relations (salesOrder, customer, lotDetails, harvestLots)', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      const createResponse = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-FULL-RELATIONS',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 180,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get(`/shipments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('salesOrder');
      expect(response.body.data.salesOrder).toHaveProperty('customer');
      expect(response.body.data).toHaveProperty('lotDetails');
      expect(response.body.data.lotDetails[0]).toHaveProperty('harvestLot');
      expect(response.body.data.lotDetails[0]).toHaveProperty('salesOrderDetail');
    });

    it('should return 404 for non-existent shipment', async () => {
      // Act
      const response = await request(app)
        .get('/shipments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should NOT allow OPERARIO to get shipment details', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      const createResponse = await request(app)
        .post(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-OP-TEST',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get(`/shipments/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/shipments/some-id');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /sales-orders/:salesOrderId/shipments - Get shipments by sales order', () => {
    it('should allow ADMIN to get all shipments for a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;

      // Create multiple shipments
      await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-SO-001',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 100,
            },
          ],
        });

      await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-SO-002',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 150,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].salesOrderId).toBe(salesOrderId);
      expect(response.body.data[1].salesOrderId).toBe(salesOrderId);
    });

    it('should allow CAPATAZ to get shipments for a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;

      await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          trackingNumber: 'TRACK-CAP-001',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: scenario.salesOrder.details[0]!.id,
              quantityTakenKg: 200,
            },
          ],
        });

      // Act
      const response = await request(app)
        .get(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for sales order with no shipments', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Create another sales order without shipments
      const newOrder = await createTestSalesOrder(dataSource, {
        customerId: scenario.customer.id,
        details: [
          {
            caliber: WalnutCaliber.MEDIUM,
            variety: 'Chandler',
            quantityKg: 300,
            unitPrice: 12.00,
          },
        ],
      });

      // Act
      const response = await request(app)
        .get(`/sales-orders/${newOrder.id}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return empty array for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .get('/sales-orders/00000000-0000-0000-0000-000000000000/shipments')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should NOT allow OPERARIO to get shipments for sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);

      // Act
      const response = await request(app)
        .get(`/sales-orders/${scenario.salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/sales-orders/some-id/shipments');
      expect(response.status).toBe(401);
    });
  });

  describe('Business Logic Tests', () => {
    it('should track complete shipment flow: create → update stock → update sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;
      const harvestLotId = scenario.inStockLot.id;

      // Initial state: 
      // - inStockLot: 1600 kg remaining
      // - salesOrder detail[0]: 500 kg ordered, 0 shipped

      // Act: Create shipment
      const shipmentResponse = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-FLOW-001',
          notes: 'Primer envío parcial',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: detailId,
              quantityTakenKg: 350,
            },
          ],
        });

      expect(shipmentResponse.status).toBe(201);

      // Verify harvest lot stock decreased
      const lotResponse = await request(app)
        .get(`/harvest-lots/${harvestLotId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(lotResponse.body.data.remainingNetWeightKg).toBe(1250); // 1600 - 350

      // Verify sales order detail updated
      const orderResponse = await request(app)
        .get(`/sales-orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const detail = orderResponse.body.data.details.find((d: any) => d.id === detailId);
      expect(detail.quantityShipped).toBe(350);
      expect(detail.quantityPending).toBe(150); // 500 - 350
      expect(detail.percentageShipped).toBe(70); // (350/500) * 100
    });

    it('should handle multiple shipments for same sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;
      const harvestLotId = scenario.inStockLot.id;

      // Create first shipment
      await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-MULTI-001',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: detailId,
              quantityTakenKg: 200,
            },
          ],
        });

      // Create second shipment
      await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-MULTI-002',
          lotDetails: [
            {
              harvestLotId: harvestLotId,
              salesOrderDetailId: detailId,
              quantityTakenKg: 150,
            },
          ],
        });

      // Verify cumulative updates
      const orderResponse = await request(app)
        .get(`/sales-orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const detail = orderResponse.body.data.details.find((d: any) => d.id === detailId);
      expect(detail.quantityShipped).toBe(350); // 200 + 150
      expect(detail.quantityPending).toBe(150); // 500 - 350

      // Verify harvest lot
      const lotResponse = await request(app)
        .get(`/harvest-lots/${harvestLotId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(lotResponse.body.data.remainingNetWeightKg).toBe(1250); // 1600 - 350
    });

    it('should handle shipment from multiple harvest lots for one sales order detail', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Create second harvest lot
      const secondLot = await createTestHarvestLot(dataSource, {
        plotId: scenario.plot.id,
        harvestDate: new Date('2025-03-22'),
        lotCode: 'LOT-SECOND-SOURCE',
        varietyName: 'Serr',
        caliber: WalnutCaliber.JUMBO,
        grossWeightKg: 800,
        netWeightKg: 700,
        status: HarvestLotStatus.EN_STOCK,
      });

      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;

      // Act: Create shipment using both lots
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-TWO-LOTS',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 250,
            },
            {
              harvestLotId: secondLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 200,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify both lots updated
      const lot1Response = await request(app)
        .get(`/harvest-lots/${scenario.inStockLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);
      expect(lot1Response.body.data.remainingNetWeightKg).toBe(1350); // 1600 - 250

      const lot2Response = await request(app)
        .get(`/harvest-lots/${secondLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);
      expect(lot2Response.body.data.remainingNetWeightKg).toBe(500); // 700 - 200

      // Verify sales order detail
      const orderResponse = await request(app)
        .get(`/sales-orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const detail = orderResponse.body.data.details.find((d: any) => d.id === detailId);
      expect(detail.quantityShipped).toBe(450); // 250 + 200
    });

    it('should mark harvest lot as VENDIDO when fully depleted', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      
      // Create small lot to deplete
      const smallLot = await createTestHarvestLot(dataSource, {
        plotId: scenario.plot.id,
        harvestDate: new Date('2025-03-23'),
        lotCode: 'LOT-SMALL',
        varietyName: 'Serr',
        caliber: WalnutCaliber.JUMBO,
        grossWeightKg: 300,
        netWeightKg: 250,
        status: HarvestLotStatus.EN_STOCK,
      });

      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;

      // Act: Ship entire lot
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-DEPLETE',
          lotDetails: [
            {
              harvestLotId: smallLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 250,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify lot status changed to VENDIDO
      const lotResponse = await request(app)
        .get(`/harvest-lots/${smallLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(lotResponse.body.data.remainingNetWeightKg).toBe(0);
      expect(lotResponse.body.data.status).toBe(HarvestLotStatus.VENDIDO);
    });

    it('should prevent overselling sales order detail quantity', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detailId = scenario.salesOrder.details[0]!.id;
      // detail[0] has 500 kg ordered

      // Act: Try to ship more than ordered
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-OVERSELL',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: detailId,
              quantityTakenKg: 600, // Exceeds 500 kg ordered
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain('No se puede enviar');
    });

    it('should handle shipments for multiple details in same sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id, SalesOrderStatus.APROBADA);
      const salesOrderId = scenario.salesOrder.id;
      const detail1Id = scenario.salesOrder.details[0]!.id; // JUMBO, 500 kg
      const detail2Id = scenario.salesOrder.details[1]!.id; // LARGE, 300 kg

      // Create another lot for LARGE caliber
      const largeLot = await createTestHarvestLot(dataSource, {
        plotId: scenario.plot.id,
        harvestDate: new Date('2025-03-24'),
        lotCode: 'LOT-LARGE',
        varietyName: 'Serr',
        caliber: WalnutCaliber.LARGE,
        grossWeightKg: 600,
        netWeightKg: 500,
        status: HarvestLotStatus.EN_STOCK,
      });

      // Act: Ship to both details in one shipment
      const response = await request(app)
        .post(`/sales-orders/${salesOrderId}/shipments`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          trackingNumber: 'TRACK-MULTI-DETAIL',
          lotDetails: [
            {
              harvestLotId: scenario.inStockLot.id,
              salesOrderDetailId: detail1Id,
              quantityTakenKg: 300,
            },
            {
              harvestLotId: largeLot.id,
              salesOrderDetailId: detail2Id,
              quantityTakenKg: 200,
            },
          ],
        });

      expect(response.status).toBe(201);

      // Verify both details updated
      const orderResponse = await request(app)
        .get(`/sales-orders/${salesOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      const detail1 = orderResponse.body.data.details.find((d: any) => d.id === detail1Id);
      expect(detail1.quantityShipped).toBe(300);

      const detail2 = orderResponse.body.data.details.find((d: any) => d.id === detail2Id);
      expect(detail2.quantityShipped).toBe(200);
    });
  });
});



