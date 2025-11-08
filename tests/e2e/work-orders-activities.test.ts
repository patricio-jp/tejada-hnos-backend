import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser, createTestUser } from '../helpers/auth.helper';
import {
  setupWorkOrderScenario,
  createTestWorkOrder,
  createTestActivity,
  setupFieldPlotScenario,
  createTestField,
  createTestPlot,
  createTestVariety,
} from '../helpers/fixtures.helper';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { WorkOrderStatus, ActivityStatus, ActivityType, UserRole } from '@/enums';
import { TestDebugger } from '../helpers/debug.helper';

describe('E2E: Work Orders and Activities Flow', () => {
  let app: Express;
  let dataSource: DataSource;
  let admin: TestUser;
  let capataz: TestUser;
  let capatazB: TestUser; // Second capataz for cross-user tests
  let operario: TestUser;
  let operario2: TestUser;
  let operario3: TestUser; // Third operario for additional tests

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

    // Create additional capataz for cross-user permission tests
    capatazB = await createTestUser(dataSource, {
      email: 'capatazB@test.com',
      name: 'Capataz B',
      lastName: 'Test',
      role: UserRole.CAPATAZ,
      password: 'capatazB123',
      hourlyRate: 30,
    });

    // Create additional operarios for cross-user tests
    operario2 = await createTestUser(dataSource, {
      email: 'operario2@test.com',
      name: 'Operario B',
      lastName: 'Test',
      role: UserRole.OPERARIO,
      password: 'operario2123',
      hourlyRate: 20,
    });

    operario3 = await createTestUser(dataSource, {
      email: 'operario3@test.com',
      name: 'Operario C',
      lastName: 'Test',
      role: UserRole.OPERARIO,
      password: 'operario3123',
      hourlyRate: 20,
    });
  });

  describe('GET /work-orders - List work orders', () => {
    it('should allow ADMIN to see all work orders', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow CAPATAZ to see work orders related to managed fields', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      // Capataz should only see work orders for fields they manage
      expect(response.body.data.length).toBeGreaterThan(0);
      const workOrderIds = response.body.data.map((wo: any) => wo.id);
      expect(workOrderIds).toContain(scenario.assignedWorkOrder.id);
    });

    it('should ensure CAPATAZ_A and CAPATAZ_B see only their managed fields work orders', async () => {
      // Arrange: Create fields for each capataz
      const fieldA = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const fieldB = await createTestField(dataSource, {
        name: 'Campo B',
        area: 150,
        address: 'Address B',
        managerId: capatazB.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plotA = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: fieldA.id,
        varietyId: variety.id,
      });

      const plotB = await createTestPlot(dataSource, {
        name: 'Parcela B1',
        area: 30,
        fieldId: fieldB.id,
        varietyId: variety.id,
      });

      // Create work orders for each field
      const woA = await createTestWorkOrder(dataSource, {
        title: 'Work Order A',
        description: 'For Campo A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plotA.id],
      });

      const woB = await createTestWorkOrder(dataSource, {
        title: 'Work Order B',
        description: 'For Campo B',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario2.id,
        plotIds: [plotB.id],
      });

      // Act: Get work orders for Capataz A
      const responseA = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Capataz A should only see WO A
      expect(responseA.status).toBe(200);
      const woIdsA = responseA.body.data.map((wo: any) => wo.id);
      expect(woIdsA).toContain(woA.id);
      expect(woIdsA).not.toContain(woB.id);

      // Act: Get work orders for Capataz B
      const responseB = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Capataz B should only see WO B
      expect(responseB.status).toBe(200);
      const woIdsB = responseB.body.data.map((wo: any) => wo.id);
      expect(woIdsB).toContain(woB.id);
      expect(woIdsB).not.toContain(woA.id);
    });

    it('should allow OPERARIO to see only assigned work orders', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(scenario.assignedWorkOrder.id);
      expect(response.body.data[0].assignedToId).toBe(operario.id);
    });

    it('should ensure each OPERARIO sees only their assigned work orders', async () => {
      // Arrange: Create field and plots
      const field = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plot = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: field.id,
        varietyId: variety.id,
      });

      // Create work orders assigned to different operarios
      const wo1 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario A',
        description: 'Assigned to Operario A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plot.id],
      });

      const wo2 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario B',
        description: 'Assigned to Operario B',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario2.id,
        plotIds: [plot.id],
      });

      const wo3 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario C',
        description: 'Assigned to Operario C',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario3.id,
        plotIds: [plot.id],
      });

      // Act & Assert: Operario 1 should only see their WO
      const response1 = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${operario.token}`);

      expect(response1.status).toBe(200);
      expect(response1.body.data).toHaveLength(1);
      expect(response1.body.data[0].id).toBe(wo1.id);
      expect(response1.body.data[0].assignedToId).toBe(operario.id);

      // Act & Assert: Operario 2 should only see their WO
      const response2 = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${operario2.token}`);

      expect(response2.status).toBe(200);
      expect(response2.body.data).toHaveLength(1);
      expect(response2.body.data[0].id).toBe(wo2.id);
      expect(response2.body.data[0].assignedToId).toBe(operario2.id);

      // Act & Assert: Operario 3 should only see their WO
      const response3 = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${operario3.token}`);

      expect(response3.status).toBe(200);
      expect(response3.body.data).toHaveLength(1);
      expect(response3.body.data[0].id).toBe(wo3.id);
      expect(response3.body.data[0].assignedToId).toBe(operario3.id);
    });

    it('should return empty array for OPERARIO with no assigned work orders', async () => {
      // Arrange
      await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act - operario2 has no work orders assigned
      const response = await request(app)
        .get('/work-orders')
        .set('Authorization', `Bearer ${operario2.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/work-orders');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /work-orders/:id - Get work order by ID', () => {
    it('should allow ADMIN to get any work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.assignedWorkOrder.id);
      expect(response.body.data.title).toBe('Poda de invierno');
    });

    it('should allow CAPATAZ to get work order from managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.assignedWorkOrder.id);
    });

    it('should deny CAPATAZ access to work order from unmanaged field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const response = await request(app)
        .get(`/work-orders/${scenario.unassignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assertion
      expect(response.status).toBe(403);
    });

    it('should deny CAPATAZ_B access to CAPATAZ_A managed field work order', async () => {
      // Arrange: Create field managed by capataz A
      const fieldA = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plotA = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: fieldA.id,
        varietyId: variety.id,
      });

      const woA = await createTestWorkOrder(dataSource, {
        title: 'Work Order for Campo A',
        description: 'Managed by Capataz A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plotA.id],
      });

      // Act: Try to access with capataz B
      const response = await request(app)
        .get(`/work-orders/${woA.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Should be denied
      expect(response.status).toBe(403);
    });

    it('should allow OPERARIO to get assigned work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.assignedWorkOrder.id);
    });

    it('should deny OPERARIO access to unassigned work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get(`/work-orders/${scenario.unassignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO_2 access to OPERARIO_1 assigned work order', async () => {
      // Arrange: Create work order assigned to operario 1
      const field = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plot = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: field.id,
        varietyId: variety.id,
      });

      const wo1 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario A',
        description: 'Assigned to Operario A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plot.id],
      });

      // Act: Try to access with operario 2
      const response = await request(app)
        .get(`/work-orders/${wo1.id}`)
        .set('Authorization', `Bearer ${operario2.token}`);

      // Assert: Should be denied
      expect(response.status).toBe(403);
    });

    it('should ensure each OPERARIO can only access their own work orders', async () => {
      // Arrange: Create work orders for different operarios
      const field = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plot = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: field.id,
        varietyId: variety.id,
      });

      const wo1 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario A',
        description: 'Assigned to Operario A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plot.id],
      });

      const wo2 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario B',
        description: 'Assigned to Operario B',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario2.id,
        plotIds: [plot.id],
      });

      // Act & Assert: Operario 1 can access WO1
      const response1 = await request(app)
        .get(`/work-orders/${wo1.id}`)
        .set('Authorization', `Bearer ${operario.token}`);
      expect(response1.status).toBe(200);
      expect(response1.body.data.assignedToId).toBe(operario.id);

      // Act & Assert: Operario 2 can access WO2
      const response2 = await request(app)
        .get(`/work-orders/${wo2.id}`)
        .set('Authorization', `Bearer ${operario2.token}`);
      expect(response2.status).toBe(200);
      expect(response2.body.data.assignedToId).toBe(operario2.id);

      // Act & Assert: Operario 1 cannot access WO2
      const responseCross1 = await request(app)
        .get(`/work-orders/${wo2.id}`)
        .set('Authorization', `Bearer ${operario.token}`);
      expect(responseCross1.status).toBe(403);

      // Act & Assert: Operario 2 cannot access WO1
      const responseCross2 = await request(app)
        .get(`/work-orders/${wo1.id}`)
        .set('Authorization', `Bearer ${operario2.token}`);
      expect(responseCross2.status).toBe(403);
    });
  });

  describe('POST /work-orders - Create work order', () => {
    it('should allow ADMIN to create a work order', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      const workOrderData = {
        title: 'New Work Order',
        description: 'Test work order',
        scheduledDate: new Date('2025-07-01').toISOString(),
        dueDate: new Date('2025-07-15').toISOString(),
        assignedToUserId: operario.id,
        plotIds: [scenario.managedPlot.id],
      };

      // Act
      const response = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(workOrderData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('New Work Order');
      expect(response.body.data.assignedToId).toBe(operario.id);

      // Verify in database
      const workOrderRepository = dataSource.getRepository(WorkOrder);
      const savedWorkOrder = await workOrderRepository.findOne({
        where: { id: response.body.data.id },
        relations: ['plots'],
      });
      expect(savedWorkOrder).toBeTruthy();
      expect(savedWorkOrder!.plots).toHaveLength(1);
      if (savedWorkOrder!.plots && savedWorkOrder!.plots.length > 0) {
        expect(savedWorkOrder!.plots[0]!.id).toBe(scenario.managedPlot.id);
      }
    });

    it('should allow CAPATAZ to create work order for managed field', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      const workOrderData = {
        title: 'Capataz Work Order',
        description: 'Test work order by capataz',
        scheduledDate: new Date('2025-07-01').toISOString(),
        dueDate: new Date('2025-07-15').toISOString(),
        assignedToUserId: operario.id,
        plotIds: [scenario.managedPlot.id],
      };

      // Act
      const response = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(workOrderData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Capataz Work Order');
    });

    it('should deny CAPATAZ from creating work order for unmanaged field', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      const workOrderData = {
        title: 'Invalid Work Order',
        description: 'Should fail',
        scheduledDate: new Date('2025-07-01').toISOString(),
        dueDate: new Date('2025-07-15').toISOString(),
        assignedToUserId: operario.id,
        plotIds: [scenario.unmanagedPlot.id], // Unmanaged plot
      };

      // Act
      const response = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(workOrderData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from creating work order', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      const workOrderData = {
        title: 'Invalid Work Order',
        description: 'Should fail',
        scheduledDate: new Date('2025-07-01').toISOString(),
        dueDate: new Date('2025-07-15').toISOString(),
        plotIds: [scenario.managedPlot.id],
      };

      // Act
      const response = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${operario.token}`)
        .send(workOrderData);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /work-orders/:id - Update work order', () => {
    it('should allow ADMIN to update any work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Updated Title',
          status: WorkOrderStatus.COMPLETED,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.status).toBe(WorkOrderStatus.COMPLETED);

      // Verify in database
      const workOrderRepository = dataSource.getRepository(WorkOrder);
      const updated = await workOrderRepository.findOne({
        where: { id: scenario.assignedWorkOrder.id },
      });
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.status).toBe(WorkOrderStatus.COMPLETED);
    });

    it('should allow CAPATAZ to update work order from managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          description: 'Updated by capataz',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated by capataz');
    });

    it('should deny CAPATAZ from updating work order from unmanaged field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/work-orders/${scenario.unassignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          title: 'Should fail',
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from updating work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          title: 'Should fail',
        });

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /work-orders/:id - Soft delete work order', () => {
    it('should allow ADMIN to soft delete any work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();

      // Verify in database (soft delete)
      const workOrderRepository = dataSource.getRepository(WorkOrder);
      const deleted = await workOrderRepository.findOne({
        where: { id: scenario.assignedWorkOrder.id },
        withDeleted: true,
      });
      expect(deleted).toBeTruthy();
      expect(deleted!.deletedAt).toBeTruthy();
    });

    it('should allow CAPATAZ to delete work order from managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('should deny CAPATAZ from deleting work order from unmanaged field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/work-orders/${scenario.unassignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from deleting work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/work-orders/${scenario.assignedWorkOrder.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('POST /work-orders/:workOrderId/activities - Create activity', () => {
    it('should allow OPERARIO to create activity for assigned work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const activityData = {
        type: ActivityType.PODA,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
        details: {
          notes: 'Completed pruning on section A',
        },
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe(ActivityType.PODA);
      expect(response.body.data.status).toBe(ActivityStatus.PENDING); // Default status
      expect(response.body.data.hoursWorked).toBe(4);
      expect(response.body.data.workOrderId).toBe(scenario.assignedWorkOrder.id);

      // Verify in database
      const activityRepository = dataSource.getRepository(Activity);
      const savedActivity = await activityRepository.findOne({
        where: { id: response.body.data.id },
      });
      expect(savedActivity).toBeTruthy();
      expect(savedActivity!.status).toBe(ActivityStatus.PENDING);
    });

    it('should deny OPERARIO from creating activity for unassigned work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const activityData = {
        type: ActivityType.PODA,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.unassignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should allow CAPATAZ to create activity for work order in managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 5,
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe(ActivityType.APLICACION);
    });

    it('should allow ADMIN to create activity for any work order', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const activityData = {
        type: ActivityType.COSECHA,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 8,
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe(ActivityType.COSECHA);
    });
  });

  describe('GET /activities - List activities', () => {
    it('should allow ADMIN to see all activities', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow CAPATAZ to see activities from managed fields', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should deny CAPATAZ_B from seeing activities in CAPATAZ_A managed fields', async () => {
      // Arrange: Create field managed by capataz A with work order and activity
      const fieldA = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plotA = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: fieldA.id,
        varietyId: variety.id,
      });

      const woA = await createTestWorkOrder(dataSource, {
        title: 'Work Order A',
        description: 'In Campo A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plotA.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      await createTestActivity(dataSource, {
        workOrderId: woA.id,
        type: ActivityType.PODA,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 6,
      });

      // Act: Try to get activities with capataz B
      const response = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Should an empty array be returned for activities in capataz A's field
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('should allow CAPATAZ to filter activities by assigned user', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${capataz.token}`)
        .query({ assignedToId: operario.id });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      // All activities should be from the specified operario
      response.body.data.forEach((activity: any) => {
        expect(activity.workOrder.assignedToId).toBe(operario.id);
      });
    });

    it('should allow OPERARIO to see activities from assigned work orders', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      // All activities should be from the assigned work order
      response.body.data.forEach((activity: any) => {
        expect(activity.workOrderId).toBe(scenario.assignedWorkOrder.id);
      });
    });
  });

  describe('PUT /activities/:id - Update activity (Approval workflow)', () => {
    it('should allow OPERARIO to update their own pending activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          hoursWorked: 7,
          details: {
            notes: 'Updated hours',
          },
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.hoursWorked).toBe(7);
      expect(response.body.data.status).toBe(ActivityStatus.PENDING);
    });

    it('should allow CAPATAZ to approve pending activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(ActivityStatus.APPROVED);

      // Verify in database
      const activityRepository = dataSource.getRepository(Activity);
      const approved = await activityRepository.findOne({
        where: { id: scenario.pendingActivity.id },
      });
      expect(approved!.status).toBe(ActivityStatus.APPROVED);
    });

    it('should allow CAPATAZ to reject pending activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.REJECTED,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(ActivityStatus.REJECTED);

      // Verify in database
      const activityRepository = dataSource.getRepository(Activity);
      const rejected = await activityRepository.findOne({
        where: { id: scenario.pendingActivity.id },
      });
      expect(rejected!.status).toBe(ActivityStatus.REJECTED);
    });

    it('should allow ADMIN to approve pending activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(ActivityStatus.APPROVED);
    });

    it('should deny CAPATAZ_B from approving activity in CAPATAZ_A managed field', async () => {
      // Arrange: Create field managed by capataz A with work order and activity
      const fieldA = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plotA = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: fieldA.id,
        varietyId: variety.id,
      });

      const woA = await createTestWorkOrder(dataSource, {
        title: 'Work Order A',
        description: 'In Campo A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plotA.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const activityA = await createTestActivity(dataSource, {
        workOrderId: woA.id,
        type: ActivityType.PODA,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 5,
        status: ActivityStatus.PENDING,
      });

      // Act: Try to approve with capataz B (who doesn't manage field A)
      const response = await request(app)
        .put(`/activities/${activityA.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert: Should be denied
      expect(response.status).toBe(403);
    });

    it('should ensure each CAPATAZ can only approve activities in their managed fields', async () => {
      // Arrange: Create fields for each capataz with work orders and activities
      const fieldA = await createTestField(dataSource, {
        name: 'Campo A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const fieldB = await createTestField(dataSource, {
        name: 'Campo B',
        area: 150,
        address: 'Address B',
        managerId: capatazB.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plotA = await createTestPlot(dataSource, {
        name: 'Parcela A1',
        area: 25,
        fieldId: fieldA.id,
        varietyId: variety.id,
      });

      const plotB = await createTestPlot(dataSource, {
        name: 'Parcela B1',
        area: 30,
        fieldId: fieldB.id,
        varietyId: variety.id,
      });

      const woA = await createTestWorkOrder(dataSource, {
        title: 'Work Order A',
        description: 'In Campo A',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plotA.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const woB = await createTestWorkOrder(dataSource, {
        title: 'Work Order B',
        description: 'In Campo B',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario2.id,
        plotIds: [plotB.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const activityA = await createTestActivity(dataSource, {
        workOrderId: woA.id,
        type: ActivityType.PODA,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 5,
        status: ActivityStatus.PENDING,
      });

      const activityB = await createTestActivity(dataSource, {
        workOrderId: woB.id,
        type: ActivityType.RIEGO,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 4,
        status: ActivityStatus.PENDING,
      });

      // Act & Assert: Capataz A can approve activity in field A
      const responseApproveA = await request(app)
        .put(`/activities/${activityA.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({ status: ActivityStatus.APPROVED });
      expect(responseApproveA.status).toBe(200);
      expect(responseApproveA.body.data.status).toBe(ActivityStatus.APPROVED);

      // Act & Assert: Capataz B can approve activity in field B
      const responseApproveB = await request(app)
        .put(`/activities/${activityB.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`)
        .send({ status: ActivityStatus.APPROVED });
      expect(responseApproveB.status).toBe(200);
      expect(responseApproveB.body.data.status).toBe(ActivityStatus.APPROVED);

      // Create new pending activities for cross-check
      const activityA2 = await createTestActivity(dataSource, {
        workOrderId: woA.id,
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-07-03'),
        hoursWorked: 3,
        status: ActivityStatus.PENDING,
      });

      const activityB2 = await createTestActivity(dataSource, {
        workOrderId: woB.id,
        type: ActivityType.COSECHA,
        executionDate: new Date('2025-07-03'),
        hoursWorked: 8,
        status: ActivityStatus.PENDING,
      });

      // Act & Assert: Capataz A cannot approve activity in field B
      const responseCrossA = await request(app)
        .put(`/activities/${activityB2.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({ status: ActivityStatus.APPROVED });
      expect(responseCrossA.status).toBe(403);

      // Act & Assert: Capataz B cannot approve activity in field A
      const responseCrossB = await request(app)
        .put(`/activities/${activityA2.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`)
        .send({ status: ActivityStatus.APPROVED });
      expect(responseCrossB.status).toBe(403);
    });

    it('should deny OPERARIO from approving their own activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Note: This test assumes business logic prevents operarios from changing status to APPROVED
      // If your API allows it, this test should be adjusted or the business logic should be implemented

      // Act
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          status: ActivityStatus.APPROVED, // Operario trying to approve
        });

      // Assert
      // Should either reject with 403 or ignore the status change and keep it PENDING
      // Adjust based on your actual implementation
      if (response.status === 200) {
        // If accepted, status should remain PENDING (business logic)
        expect(response.body.data.status).toBe(ActivityStatus.PENDING);
      } else {
        // Or directly rejected
        expect(response.status).toBe(403);
      }
    });

    it('should deny OPERARIO from updating activity of another operario', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act - operario2 trying to update operario's activity
      const response = await request(app)
        .put(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${operario2.token}`)
        .send({
          hoursWorked: 10,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should ensure OPERARIO can only update their own activities', async () => {
      // Arrange: Create work orders and activities for different operarios
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      const variety = await createTestVariety(dataSource, {
        name: 'Test Variety',
      });

      const plot = await createTestPlot(dataSource, {
        name: 'Test Plot',
        area: 25,
        fieldId: field.id,
        varietyId: variety.id,
      });

      // Create work orders for operario 1 and 2
      const wo1 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario 1',
        description: 'Assigned to operario 1',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario.id,
        plotIds: [plot.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      const wo2 = await createTestWorkOrder(dataSource, {
        title: 'WO for Operario 2',
        description: 'Assigned to operario 2',
        scheduledDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-15'),
        assignedToId: operario2.id,
        plotIds: [plot.id],
        status: WorkOrderStatus.IN_PROGRESS,
      });

      // Create activities for each operario (already approved so they can be modified)
      const activity1 = await createTestActivity(dataSource, {
        workOrderId: wo1.id,
        type: ActivityType.PODA,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 5,
        status: ActivityStatus.APPROVED, // APPROVED so operario can update it
      });

      const activity2 = await createTestActivity(dataSource, {
        workOrderId: wo2.id,
        type: ActivityType.RIEGO,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 4,
        status: ActivityStatus.APPROVED, // APPROVED so operario can update it
      });

      // Act & Assert: Operario 1 can update their own activity
      const response1 = await request(app)
        .put(`/activities/${activity1.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({ hoursWorked: 6 });
      expect(response1.status).toBe(200);
      expect(response1.body.data.hoursWorked).toBe(6);
      expect(response1.body.data.status).toBe(ActivityStatus.PENDING);

      // Act & Assert: Operario 2 can update their own activity
      const response2 = await request(app)
        .put(`/activities/${activity2.id}`)
        .set('Authorization', `Bearer ${operario2.token}`)
        .send({ hoursWorked: 5 });
      expect(response2.status).toBe(200);
      expect(response2.body.data.hoursWorked).toBe(5);
      expect(response2.body.data.status).toBe(ActivityStatus.PENDING);

      // Act & Assert: Operario 1 cannot update operario 2's activity
      const responseCross1 = await request(app)
        .put(`/activities/${activity2.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({ hoursWorked: 10 });
      expect(responseCross1.status).toBe(403);

      // Act & Assert: Operario 2 cannot update operario 1's activity
      const responseCross2 = await request(app)
        .put(`/activities/${activity1.id}`)
        .set('Authorization', `Bearer ${operario2.token}`)
        .send({ hoursWorked: 10 });
      expect(responseCross2.status).toBe(403);
    });
  });

  describe('DELETE /activities/:id - Delete activity', () => {
    it('should allow ADMIN to delete any activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify in database (soft delete)
      const activityRepository = dataSource.getRepository(Activity);
      const deleted = await activityRepository.findOne({
        where: { id: scenario.pendingActivity.id },
        withDeleted: true,
      });
      expect(deleted).toBeTruthy();
      expect(deleted!.deletedAt).toBeTruthy();
    });

    it('should allow CAPATAZ to delete activity from managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should deny OPERARIO from deleting activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Act
      const response = await request(app)
        .delete(`/activities/${scenario.pendingActivity.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('Complete Work Order and Activity Workflow', () => {
    it('should complete the full workflow: Create WO, Add Activity, Approve Activity', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Step 1: ADMIN creates a work order
      const createWOResponse = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Complete Workflow Test',
          description: 'Testing complete workflow',
          scheduledDate: new Date('2025-08-01').toISOString(),
          dueDate: new Date('2025-08-15').toISOString(),
          assignedToUserId: operario.id,
          plotIds: [scenario.managedPlot.id],
        });

      expect(createWOResponse.status).toBe(201);
      const workOrderId = createWOResponse.body.data.id;

      // Step 2: OPERARIO creates an activity
      const createActivityResponse = await request(app)
        .post(`/work-orders/${workOrderId}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          type: ActivityType.PODA,
          executionDate: new Date('2025-08-02').toISOString(),
          hoursWorked: 6,
          details: {
            notes: 'Completed pruning successfully',
          },
        });

      expect(createActivityResponse.status).toBe(201);
      const activityId = createActivityResponse.body.data.id;
      expect(createActivityResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Step 3: OPERARIO views their activities
      const getActivitiesResponse = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${operario.token}`);

      expect(getActivitiesResponse.status).toBe(200);
      const operarioActivities = getActivitiesResponse.body.data.find((a: any) => a.id === activityId);
      expect(operarioActivities).toBeTruthy();
      expect(operarioActivities.status).toBe(ActivityStatus.PENDING);

      // Step 4: CAPATAZ reviews and approves the activity
      const approveActivityResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      expect(approveActivityResponse.status).toBe(200);
      expect(approveActivityResponse.body.data.status).toBe(ActivityStatus.APPROVED);

      // Step 5: ADMIN marks work order as completed
      const completeWOResponse = await request(app)
        .put(`/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          status: WorkOrderStatus.COMPLETED,
          completedDate: new Date('2025-08-15').toISOString(),
        });

      expect(completeWOResponse.status).toBe(200);
      expect(completeWOResponse.body.data.status).toBe(WorkOrderStatus.COMPLETED);

      // Verify final state in database
      const workOrderRepository = dataSource.getRepository(WorkOrder);
      const finalWO = await workOrderRepository.findOne({
        where: { id: workOrderId },
        relations: ['activities'],
      });
      expect(finalWO).toBeTruthy();
      expect(finalWO!.status).toBe(WorkOrderStatus.COMPLETED);
      expect(finalWO!.activities).toHaveLength(1);
      if (finalWO!.activities && finalWO!.activities.length > 0) {
        expect(finalWO!.activities[0]!.status).toBe(ActivityStatus.APPROVED);
      }
    });

    it('should test rejection workflow: Create Activity, Reject Activity, Update and Resubmit', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Step 1: OPERARIO creates an activity
      const createActivityResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          type: ActivityType.RIEGO,
          executionDate: new Date('2025-06-10').toISOString(),
          hoursWorked: 3,
        });

      expect(createActivityResponse.status).toBe(201);
      const activityId = createActivityResponse.body.data.id;

      // Step 2: CAPATAZ rejects the activity
      const rejectResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.REJECTED,
        });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.data.status).toBe(ActivityStatus.REJECTED);

      // Step 3: OPERARIO updates the rejected activity
      const updateResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          hoursWorked: 5, // Corrected hours
          details: {
            notes: 'Corrected hours after feedback',
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.hoursWorked).toBe(5);

      // Step 4: CAPATAZ approves the updated activity
      const approveResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe(ActivityStatus.APPROVED);

      // Verify final state
      const activityRepository = dataSource.getRepository(Activity);
      const finalActivity = await activityRepository.findOne({
        where: { id: activityId },
      });
      expect(finalActivity).toBeTruthy();
      expect(finalActivity!.status).toBe(ActivityStatus.APPROVED);
      expect(finalActivity!.hoursWorked).toBe(5);
    });
  });
});


