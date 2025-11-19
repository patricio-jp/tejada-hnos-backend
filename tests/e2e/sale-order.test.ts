import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser, createTestUser } from '../helpers/auth.helper';
import {
  setupSalesScenario,
  createTestCustomer,
  createTestSalesOrder,
  setupHarvestScenario,
} from '../helpers/fixtures.helper';
import { SalesOrder } from '@/entities/sale-order.entity';
import { UserRole, SalesOrderStatus, SalesOrderDetailStatus, WalnutCaliber } from '@/enums';

describe('E2E: Sales Orders Flow', () => {
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

  describe('POST /sales-orders - Create sales order', () => {
    it('should allow ADMIN to create a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 800,
              unitPrice: 18.00,
            },
            {
              caliber: WalnutCaliber.LARGE,
              variety: 'Chandler',
              quantityKg: 400,
              unitPrice: 15.50,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.customerId).toBe(scenario.customer.id);
      expect(response.body.data.status).toBe(SalesOrderStatus.PENDIENTE);
      expect(response.body.data.details).toHaveLength(2);
      expect(response.body.data.details[0].quantityKg).toBe(800);
      expect(response.body.data.details[0].unitPrice).toBe(18.00);
      expect(response.body.data.details[0].status).toBe(SalesOrderDetailStatus.PENDIENTE);
    });

    it('should allow CAPATAZ to create a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.MEDIUM,
              variety: 'Serr',
              quantityKg: 600,
              unitPrice: 13.25,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.customerId).toBe(scenario.customer.id);
      expect(response.body.data.status).toBe(SalesOrderStatus.PENDIENTE);
      expect(response.body.data.details).toHaveLength(1);
    });

    it('should calculate totalAmount correctly', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 100,
              unitPrice: 20.00, // subtotal: 2000
            },
            {
              caliber: WalnutCaliber.LARGE,
              variety: 'Serr',
              quantityKg: 50,
              unitPrice: 15.00, // subtotal: 750
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      // totalAmount should be 2000 + 750 = 2750
      expect(response.body.data.totalAmount).toBe(2750);
    });

    it('should NOT allow OPERARIO to create a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 100,
              unitPrice: 20.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      // Act - Missing customerId
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 100,
              unitPrice: 20.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toEqual('customerId');
    });

    it('should validate details array is not empty', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [],
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].field).toEqual('details');
    });

    it('should validate quantityKg and unitPrice are positive', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: -100,
              unitPrice: -20.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(400);
      const errors = response.body.errors;
      const quantityError = errors.find((e: any) => e.field === 'quantityKg');
      const priceError = errors.find((e: any) => e.field === 'unitPrice');
      expect(quantityError).toBeDefined();
      expect(priceError).toBeDefined();
      expect(quantityError.message).toContain('mayor a 0');
      expect(priceError.message).toContain('no puede ser negativo');
    });

    it('should validate customer exists', async () => {
      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: '09796edb-1784-494d-ae84-f54d029b4052', // Non-existent customer, valid UUID
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 100,
              unitPrice: 20.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/sales-orders')
        .send({
          customerId: 'some-id',
          details: [],
        });
      expect(response.status).toBe(401);
    });
  });

  describe('GET /sales-orders - List sales orders', () => {
    it('should allow ADMIN to see all sales orders', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
      
      const orderIds = response.body.data.map((order: any) => order.id);
      expect(orderIds).toContain(scenario.salesOrder.id);
    });

    it('should allow CAPATAZ to see all sales orders', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should include calculated fields in response', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      const order = response.body.data.find((o: any) => o.id === scenario.salesOrder.id);
      expect(order).toBeDefined();
      expect(order.details[0]).toHaveProperty('subtotal');
      expect(order.details[0]).toHaveProperty('quantityShipped');
      expect(order.details[0]).toHaveProperty('quantityPending');
      expect(order.details[0]).toHaveProperty('percentageShipped');
    });

    it('should NOT allow OPERARIO to list sales orders', async () => {
      // Act
      const response = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/sales-orders');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /sales-orders/:id - Get sales order by ID', () => {
    it('should allow ADMIN to get sales order by ID', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.salesOrder.id);
      expect(response.body.data.customerId).toBe(scenario.customer.id);
      expect(response.body.data.details).toHaveLength(2);
    });

    it('should allow CAPATAZ to get sales order by ID', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.salesOrder.id);
    });

    it('should include customer relationship', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data.customer.name).toBe(scenario.customer.name);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .get('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should validate UUID format', async () => {
      // Act
      const response = await request(app)
        .get('/sales-orders/invalid-uuid')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(400);
    });

    it('should NOT allow OPERARIO to get sales order details', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/sales-orders/some-id');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /sales-orders/:id - Update sales order', () => {
    it('should allow ADMIN to update sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      const newCustomer = await createTestCustomer(dataSource, {
        name: 'Nuevo Cliente',
        taxId: '88888888-8',
      });

      // Act
      const response = await request(app)
        .put(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: newCustomer.id,
          details: [
            {
              id: scenario.salesOrder.details[0]!.id,
              quantityKg: 550,
              unitPrice: 16.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.customerId).toBe(newCustomer.id);
    });

    it('should allow CAPATAZ to update sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          details: [
            {
              id: scenario.salesOrder.details[0]!.id,
              quantityKg: 600,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(200);
    });

    it('should update existing details and add new ones', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      const existingDetailId = scenario.salesOrder.details[0]!.id;

      // Act
      const response = await request(app)
        .put(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          details: [
            {
              id: existingDetailId,
              quantityKg: 700,
              unitPrice: 17.00,
            },
            {
              // New detail without ID
              caliber: WalnutCaliber.SMALL,
              variety: 'Chandler',
              quantityKg: 200,
              unitPrice: 10.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.details.length).toBeGreaterThanOrEqual(2);
    });

    it('should NOT allow OPERARIO to update sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          details: [
            {
              id: scenario.salesOrder.details[0]!.id,
              quantityKg: 999,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .put('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          details: [],
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should validate UUID format', async () => {
      // Act
      const response = await request(app)
        .put('/sales-orders/invalid-uuid')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          details: [],
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/sales-orders/some-id')
        .send({ details: [] });
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /sales-orders/:id/status - Update sales order status', () => {
    it('should allow ADMIN to update sales order status', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.APROBADA,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(SalesOrderStatus.APROBADA);
    });

    it('should allow status transition to DESPACHADA_PARCIAL', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.DESPACHADA_PARCIAL,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(SalesOrderStatus.DESPACHADA_PARCIAL);
    });

    it('should allow updating detail statuses along with order status', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      const detailId = scenario.salesOrder.details[0]!.id;

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.DESPACHADA_PARCIAL,
          details: [
            {
              detailId: detailId,
              status: SalesOrderDetailStatus.DESPACHADA_PARCIAL,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(SalesOrderStatus.DESPACHADA_PARCIAL);
    });

    it('should NOT allow CAPATAZ to update sales order status', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: SalesOrderStatus.APROBADA,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should NOT allow OPERARIO to update sales order status', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          status: SalesOrderStatus.APROBADA,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate status is required', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({});

      // Assert
      expect(response.status).toBe(400);
    });

    it('should validate status enum value', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: 'INVALID_STATUS',
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .patch('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6/status')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.APROBADA,
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .patch('/sales-orders/some-id/status')
        .send({ status: SalesOrderStatus.APROBADA });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /sales-orders/:id - Soft delete sales order', () => {
    it('should allow ADMIN to soft delete sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('deletedAt');
      expect(response.body.canRestore).toBe(true);

      // Verify it's not in regular listing
      const listResponse = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`);
      
      const orderIds = listResponse.body.data.map((order: any) => order.id);
      expect(orderIds).not.toContain(scenario.salesOrder.id);
    });

    it('should allow CAPATAZ to soft delete sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.canRestore).toBe(true);
    });

    it('should NOT allow OPERARIO to delete sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .delete('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/sales-orders/some-id');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /sales-orders/:id/restore - Restore sales order', () => {
    it('should allow ADMIN to restore soft-deleted sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      
      // First delete
      await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Act - Restore
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/restore`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.salesOrder.id);
      expect(response.body.data.deletedAt).toBeNull();

      // Verify it's back in regular listing
      const listResponse = await request(app)
        .get('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`);
      
      const orderIds = listResponse.body.data.map((order: any) => order.id);
      expect(orderIds).toContain(scenario.salesOrder.id);
    });

    it('should allow CAPATAZ to restore sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      
      await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/restore`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should NOT allow OPERARIO to restore sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      
      await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/restore`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .patch('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6/restore')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).patch('/sales-orders/some-id/restore');
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /sales-orders/:id/permanent - Hard delete sales order', () => {
    it('should allow ADMIN to permanently delete sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);
      const orderId = scenario.salesOrder.id;

      // Act
      const response = await request(app)
        .delete(`/sales-orders/${orderId}/permanent`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.canRestore).toBe(false);

      // Verify it's completely gone
      const getResponse = await request(app)
        .get(`/sales-orders/${orderId}`)
        .set('Authorization', `Bearer ${admin.token}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should NOT allow CAPATAZ to permanently delete sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/sales-orders/${scenario.salesOrder.id}/permanent`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent sales order', async () => {
      // Act
      const response = await request(app)
        .delete('/sales-orders/a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6/permanent')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/sales-orders/some-id/permanent');
      expect(response.status).toBe(401);
    });
  });

  describe('Business Logic Tests', () => {
    it('should track sales order lifecycle: create → approve → dispatch → close', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Step 1: Create sales order (PENDIENTE)
      const createResponse = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 1000,
              unitPrice: 20.00,
            },
          ],
        });

      expect(createResponse.status).toBe(201);
      const orderId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(SalesOrderStatus.PENDIENTE);

      // Step 2: Approve order
      const approveResponse = await request(app)
        .patch(`/sales-orders/${orderId}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.APROBADA,
        });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe(SalesOrderStatus.APROBADA);

      // Step 3: Mark as dispatched
      const dispatchResponse = await request(app)
        .patch(`/sales-orders/${orderId}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.DESPACHADA_TOTAL,
        });

      expect(dispatchResponse.status).toBe(200);
      expect(dispatchResponse.body.data.status).toBe(SalesOrderStatus.DESPACHADA_TOTAL);

      // Step 4: Mark as paid
      const paidResponse = await request(app)
        .patch(`/sales-orders/${orderId}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.PAGADA,
        });

      expect(paidResponse.status).toBe(200);
      expect(paidResponse.body.data.status).toBe(SalesOrderStatus.PAGADA);

      // Step 5: Close order
      const closeResponse = await request(app)
        .patch(`/sales-orders/${orderId}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.CERRADA,
        });

      expect(closeResponse.status).toBe(200);
      expect(closeResponse.body.data.status).toBe(SalesOrderStatus.CERRADA);
    });

    it('should NOT allow updating quantityShipped directly (security test)', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Create order
      const createResponse = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 1000,
              unitPrice: 20.00,
            },
          ],
        });

      const orderId = createResponse.body.data.id;
      const detailId = createResponse.body.data.details[0].id;

      // Try to update quantityShipped directly (should be ignored)
      const updateResponse = await request(app)
        .patch(`/sales-orders/${orderId}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.DESPACHADA_PARCIAL,
          details: [
            {
              detailId: detailId,
              quantityShipped: 400, // This should be ignored
            },
          ],
        });

      // Assert: quantityShipped should remain 0 (only Shipment module can update it)
      expect(updateResponse.status).toBe(200);
      const detail = updateResponse.body.data.details.find((d: any) => d.id === detailId);
      expect(detail.quantityShipped).toBe(0); // Should NOT have changed
      expect(detail.quantityPending).toBe(1000); // Should be full quantity since nothing shipped
    });

    it('should handle multiple details with different varieties and calibers', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/sales-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          customerId: scenario.customer.id,
          details: [
            {
              caliber: WalnutCaliber.JUMBO,
              variety: 'Serr',
              quantityKg: 500,
              unitPrice: 20.00,
            },
            {
              caliber: WalnutCaliber.LARGE,
              variety: 'Serr',
              quantityKg: 300,
              unitPrice: 18.00,
            },
            {
              caliber: WalnutCaliber.MEDIUM,
              variety: 'Chandler',
              quantityKg: 200,
              unitPrice: 15.00,
            },
          ],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.details).toHaveLength(3);
      
      // Total: (500*20) + (300*18) + (200*15) = 10000 + 5400 + 3000 = 18400
      expect(response.body.data.totalAmount).toBe(18400);
    });

    it('should allow cancelling a sales order', async () => {
      // Arrange
      const scenario = await setupSalesScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/sales-orders/${scenario.salesOrder.id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: SalesOrderStatus.CANCELADA,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(SalesOrderStatus.CANCELADA);
    });
  });
});


