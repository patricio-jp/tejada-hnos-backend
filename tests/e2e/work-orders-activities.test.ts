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
  createTestInput,
  createTestInputUsage,
} from '../helpers/fixtures.helper';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { Input } from '@/entities/input.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { WorkOrderStatus, ActivityStatus, ActivityType, UserRole, InputUnit } from '@/enums';
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

    it('should allow OPERARIO to create activity with inputs used (PENDING, stock NOT deducted)', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      // Create test inputs
      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante NPK',
        unit: InputUnit.KG,
        stock: 100,
        costPerUnit: 15.5,
      });

      const pesticida = await createTestInput(dataSource, {
        name: 'Pesticida Orgánico',
        unit: InputUnit.LITRO,
        stock: 50,
        costPerUnit: 25.0,
      });

      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 5,
        details: {
          notes: 'Applied fertilizer and pesticide',
        },
        inputsUsed: [
          {
            inputId: fertilizante.id,
            quantityUsed: 10.5,
          },
          {
            inputId: pesticida.id,
            quantityUsed: 3.25,
          },
        ],
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.type).toBe(ActivityType.APLICACION);
      expect(response.body.data.status).toBe(ActivityStatus.PENDING); // PENDING by default for OPERARIO
      expect(response.body.data.inputsUsed).toBeDefined();
      expect(response.body.data.inputsUsed).toHaveLength(2);

      // Verify input usages in database
      const inputUsageRepository = dataSource.getRepository(InputUsage);
      const usages = await inputUsageRepository.find({
        where: { activityId: response.body.data.id },
        relations: ['input'],
      });

      expect(usages).toHaveLength(2);
      const fertilizerUsage = usages.find((u) => u.inputId === fertilizante.id);
      const pesticideUsage = usages.find((u) => u.inputId === pesticida.id);

      expect(fertilizerUsage).toBeTruthy();
      expect(fertilizerUsage!.quantityUsed).toBe(10.5);
      expect(fertilizerUsage!.input.name).toBe('Fertilizante NPK');

      expect(pesticideUsage).toBeTruthy();
      expect(pesticideUsage!.quantityUsed).toBe(3.25);
      expect(pesticideUsage!.input.name).toBe('Pesticida Orgánico');

      // IMPORTANT: Verify stock was NOT deducted (activity is PENDING)
      const inputRepository = dataSource.getRepository(Input);
      const updatedFertilizante = await inputRepository.findOne({ where: { id: fertilizante.id } });
      const updatedPesticida = await inputRepository.findOne({ where: { id: pesticida.id } });

      expect(updatedFertilizante!.stock).toBe(100); // Stock unchanged
      expect(updatedPesticida!.stock).toBe(50); // Stock unchanged
    });

    it('should allow CAPATAZ to create activity with inputs for work order in managed field', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const herbicida = await createTestInput(dataSource, {
        name: 'Herbicida Selectivo',
        unit: InputUnit.LITRO,
        stock: 30,
        costPerUnit: 18.75,
      });

      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
        inputsUsed: [
          {
            inputId: herbicida.id,
            quantityUsed: 5.0,
          },
        ],
      };

      // Act
      const response = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(activityData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.inputsUsed).toHaveLength(1);
      expect(response.body.data.inputsUsed[0].input.name).toBe('Herbicida Selectivo');
      expect(response.body.data.inputsUsed[0].quantityUsed).toBe(5.0);
      // CAPATAZ creates as APPROVED by default, so stock should be deducted
      expect(response.body.data.status).toBe(ActivityStatus.APPROVED);

      // Verify stock was deducted
      const inputRepository = dataSource.getRepository(Input);
      const updatedHerbicida = await inputRepository.findOne({ where: { id: herbicida.id } });
      expect(updatedHerbicida!.stock).toBe(25.0); // 30 - 5 = 25
    });

    it('should deduct stock when CAPATAZ approves activity with inputs', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Test Approval',
        unit: InputUnit.KG,
        stock: 200,
        costPerUnit: 15.0,
      });

      // Create activity as OPERARIO (PENDING)
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 5,
        inputsUsed: [
          {
            inputId: fertilizante.id,
            quantityUsed: 50.0,
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);
      const activityId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Verify stock NOT deducted yet
      const inputRepository = dataSource.getRepository(Input);
      let currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(200); // Still 200

      // Act: CAPATAZ approves
      const approveResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert
      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe(ActivityStatus.APPROVED);

      // Verify stock WAS deducted after approval
      currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(150); // 200 - 50 = 150
    });

    it('should return error when approving activity with insufficient stock', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const pesticida = await createTestInput(dataSource, {
        name: 'Pesticida Low Stock',
        unit: InputUnit.LITRO,
        stock: 20, // Only 20 liters available
        costPerUnit: 30.0,
      });

      // Create activity requesting 50 liters (more than available)
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
        inputsUsed: [
          {
            inputId: pesticida.id,
            quantityUsed: 50.0, // Requesting 50 but only 20 available
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);
      const activityId = createResponse.body.data.id;

      // Act: Try to approve (should fail due to insufficient stock)
      const approveResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert
      expect(approveResponse.status).toBe(400);
      expect(approveResponse.body.errors[0].message).toContain('Stock insuficiente');
      expect(approveResponse.body.errors[0].message).toContain('Pesticida Low Stock');
      expect(approveResponse.body.errors[0].message).toContain('Disponible: 20');
      expect(approveResponse.body.errors[0].message).toContain('Requerido: 50');

      // Verify activity is still PENDING
      const activityRepository = dataSource.getRepository(Activity);
      const activity = await activityRepository.findOne({ where: { id: activityId } });
      expect(activity!.status).toBe(ActivityStatus.PENDING);

      // Verify stock unchanged
      const inputRepository = dataSource.getRepository(Input);
      const currentInput = await inputRepository.findOne({ where: { id: pesticida.id } });
      expect(currentInput!.stock).toBe(20); // Still 20, no changes
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

      // Create activities for each operario (PENDING so they can be modified)
      const activity1 = await createTestActivity(dataSource, {
        workOrderId: wo1.id,
        type: ActivityType.PODA,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 5,
        status: ActivityStatus.PENDING, // PENDING so operario can update it
      });

      const activity2 = await createTestActivity(dataSource, {
        workOrderId: wo2.id,
        type: ActivityType.RIEGO,
        executionDate: new Date('2025-07-02'),
        hoursWorked: 4,
        status: ActivityStatus.PENDING, // PENDING so operario can update it
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

    it('should allow OPERARIO to add inputs when updating PENDING activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Orgánico',
        unit: InputUnit.KG,
        stock: 200,
        costPerUnit: 12.5,
      });

      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
      };

      // Create activity without inputs (PENDING)
      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);
      const activityId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Act: Update activity to add inputs (still PENDING)
      const updateResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          hoursWorked: 5,
          inputsUsed: [
            {
              inputId: fertilizante.id,
              quantityUsed: 15.0,
            },
          ],
        });

      // Assert
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe(ActivityStatus.PENDING);
      expect(updateResponse.body.data.hoursWorked).toBe(5);
      expect(updateResponse.body.data.inputsUsed).toBeDefined();
      expect(updateResponse.body.data.inputsUsed).toHaveLength(1);
      expect(updateResponse.body.data.inputsUsed[0].quantityUsed).toBe(15.0);

      // Verify in database
      const inputUsageRepository = dataSource.getRepository(InputUsage);
      const usages = await inputUsageRepository.find({
        where: { activityId },
        relations: ['input'],
      });
      expect(usages).toHaveLength(1);
      expect(usages[0]).toBeTruthy();
      expect(usages[0]!.input).toBeTruthy();
      expect(usages[0]!.input.name).toBe('Fertilizante Orgánico');

      // Verify stock NOT deducted (still PENDING)
      const inputRepository = dataSource.getRepository(Input);
      const currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(200); // Unchanged
    });

    it('should block OPERARIO from modifying inputs in APPROVED activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Approved Test',
        unit: InputUnit.KG,
        stock: 200,
        costPerUnit: 12.5,
      });

      // Create and approve activity
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
        inputsUsed: [
          {
            inputId: fertilizante.id,
            quantityUsed: 20.0,
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      const activityId = createResponse.body.data.id;

      // Approve it
      await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({ status: ActivityStatus.APPROVED });

      // Act: Try to modify inputs (should fail)
      const updateResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          inputsUsed: [
            {
              inputId: fertilizante.id,
              quantityUsed: 50.0, // Try to change quantity
            },
          ],
        });

      // Assert
      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.errors[0].message).toContain('No puedes modificar una actividad aprobada');
      expect(updateResponse.body.errors[0].message).toContain('nueva actividad');

      // Verify stock remains at 180 (200 - 20 from approval)
      const inputRepository = dataSource.getRepository(Input);
      const currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(180);
    });

    it('should allow OPERARIO to modify inputs in PENDING activity', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const pesticida = await createTestInput(dataSource, {
        name: 'Pesticida A',
        unit: InputUnit.LITRO,
        stock: 50,
        costPerUnit: 20.0,
      });

      const herbicida = await createTestInput(dataSource, {
        name: 'Herbicida B',
        unit: InputUnit.LITRO,
        stock: 60,
        costPerUnit: 18.0,
      });

      // Create activity with one input (PENDING)
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 4,
        inputsUsed: [
          {
            inputId: pesticida.id,
            quantityUsed: 3.0,
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);
      const activityId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Act: Update activity to modify inputs (replace with different ones)
      const updateResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          inputsUsed: [
            {
              inputId: pesticida.id,
              quantityUsed: 5.0, // Changed quantity
            },
            {
              inputId: herbicida.id, // Added new input
              quantityUsed: 2.5,
            },
          ],
        });

      // Assert
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.status).toBe(ActivityStatus.PENDING);
      expect(updateResponse.body.data.inputsUsed).toHaveLength(2);

      // Verify in database
      const inputUsageRepository = dataSource.getRepository(InputUsage);
      const usages = await inputUsageRepository.find({
        where: { activityId },
        relations: ['input'],
        order: { input: { name: 'ASC' } },
      });

      expect(usages).toHaveLength(2);
      const herbicidaUsage = usages.find((u) => u.inputId === herbicida.id);
      const pesticidaUsage = usages.find((u) => u.inputId === pesticida.id);

      expect(herbicidaUsage).toBeTruthy();
      expect(herbicidaUsage!.quantityUsed).toBe(2.5);

      expect(pesticidaUsage).toBeTruthy();
      expect(pesticidaUsage!.quantityUsed).toBe(5.0);

      // Verify stock NOT deducted (still PENDING)
      const inputRepository = dataSource.getRepository(Input);
      const currentPesticida = await inputRepository.findOne({ where: { id: pesticida.id } });
      const currentHerbicida = await inputRepository.findOne({ where: { id: herbicida.id } });
      expect(currentPesticida!.stock).toBe(50); // Unchanged
      expect(currentHerbicida!.stock).toBe(60); // Unchanged
    });

    it('should allow CAPATAZ to approve activity and verify inputs are preserved with stock deducted', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Premium',
        unit: InputUnit.KG,
        stock: 150,
        costPerUnit: 18.0,
      });

      // Create activity with inputs (PENDING)
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 6,
        inputsUsed: [
          {
            inputId: fertilizante.id,
            quantityUsed: 20.0,
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);
      const activityId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Verify stock before approval
      const inputRepository = dataSource.getRepository(Input);
      let currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(150); // Stock not deducted yet

      // Act: Capataz approves the activity
      const approveResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      // Assert
      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe(ActivityStatus.APPROVED);
      expect(approveResponse.body.data.inputsUsed).toHaveLength(1);
      expect(approveResponse.body.data.inputsUsed[0].quantityUsed).toBe(20.0);

      // Verify inputs are still in database after approval
      const inputUsageRepository = dataSource.getRepository(InputUsage);
      const usages = await inputUsageRepository.find({
        where: { activityId },
        relations: ['input'],
      });
      expect(usages).toHaveLength(1);
      expect(usages[0]).toBeTruthy();
      expect(usages[0]!.quantityUsed).toBe(20.0);

      // Verify stock WAS deducted after approval
      currentInput = await inputRepository.findOne({ where: { id: fertilizante.id } });
      expect(currentInput!.stock).toBe(130); // 150 - 20 = 130
    });

    it('should retrieve activity with inputs when getting activity list', async () => {
      // Arrange
      const scenario = await setupWorkOrderScenario(dataSource, {
        capatazId: capataz.id,
        operarioId: operario.id,
      });

      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Test',
        unit: InputUnit.KG,
        stock: 100,
        costPerUnit: 10.0,
      });

      const pesticida = await createTestInput(dataSource, {
        name: 'Pesticida Test',
        unit: InputUnit.LITRO,
        stock: 50,
        costPerUnit: 15.0,
      });

      // Create activity with inputs
      const activityData = {
        type: ActivityType.APLICACION,
        executionDate: new Date('2025-06-05').toISOString(),
        hoursWorked: 5,
        inputsUsed: [
          {
            inputId: fertilizante.id,
            quantityUsed: 10.0,
          },
          {
            inputId: pesticida.id,
            quantityUsed: 2.5,
          },
        ],
      };

      const createResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(activityData);

      expect(createResponse.status).toBe(201);

      // Act: Get activities list
      const listResponse = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(listResponse.status).toBe(200);
      const activityWithInputs = listResponse.body.data.find(
        (a: any) => a.id === createResponse.body.data.id
      );
      expect(activityWithInputs).toBeTruthy();
      expect(activityWithInputs.inputsUsed).toBeDefined();
      expect(activityWithInputs.inputsUsed.length).toBeGreaterThanOrEqual(2);

      // Verify input details are included
      const fertilizerInput = activityWithInputs.inputsUsed.find(
        (u: any) => u.inputId === fertilizante.id
      );
      const pesticideInput = activityWithInputs.inputsUsed.find(
        (u: any) => u.inputId === pesticida.id
      );

      expect(fertilizerInput).toBeTruthy();
      expect(fertilizerInput.quantityUsed).toBe(10.0);
      expect(fertilizerInput.input).toBeDefined();
      expect(fertilizerInput.input.name).toBe('Fertilizante Test');

      expect(pesticideInput).toBeTruthy();
      expect(pesticideInput.quantityUsed).toBe(2.5);
      expect(pesticideInput.input.name).toBe('Pesticida Test');
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

    it('should complete full workflow with inputs: Create WO, Add Activity with Inputs, Update Inputs, Approve', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Create test inputs
      const fertilizante = await createTestInput(dataSource, {
        name: 'Fertilizante Complete Test',
        unit: InputUnit.KG,
        stock: 500,
        costPerUnit: 20.0,
      });

      const pesticida = await createTestInput(dataSource, {
        name: 'Pesticida Complete Test',
        unit: InputUnit.LITRO,
        stock: 100,
        costPerUnit: 30.0,
      });

      const herbicida = await createTestInput(dataSource, {
        name: 'Herbicida Complete Test',
        unit: InputUnit.LITRO,
        stock: 80,
        costPerUnit: 25.0,
      });

      // Step 1: CAPATAZ creates a work order
      const createWOResponse = await request(app)
        .post('/work-orders')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          title: 'Application Work Order with Inputs',
          description: 'Testing complete workflow with input tracking',
          scheduledDate: new Date('2025-08-01').toISOString(),
          dueDate: new Date('2025-08-15').toISOString(),
          assignedToUserId: operario.id,
          plotIds: [scenario.managedPlot.id],
        });

      expect(createWOResponse.status).toBe(201);
      const workOrderId = createWOResponse.body.data.id;

      // Step 2: OPERARIO creates an activity with inputs
      const createActivityResponse = await request(app)
        .post(`/work-orders/${workOrderId}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          type: ActivityType.APLICACION,
          executionDate: new Date('2025-08-02').toISOString(),
          hoursWorked: 7,
          details: {
            notes: 'Applied fertilizer and pesticide',
            weather: 'Sunny',
          },
          inputsUsed: [
            {
              inputId: fertilizante.id,
              quantityUsed: 50.0,
            },
            {
              inputId: pesticida.id,
              quantityUsed: 10.0,
            },
          ],
        });

      expect(createActivityResponse.status).toBe(201);
      const activityId = createActivityResponse.body.data.id;
      expect(createActivityResponse.body.data.status).toBe(ActivityStatus.PENDING);
      expect(createActivityResponse.body.data.inputsUsed).toHaveLength(2);

      // Step 3: CAPATAZ requests correction (reject)
      const rejectResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.REJECTED,
        });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.data.status).toBe(ActivityStatus.REJECTED);

      // Step 4: OPERARIO creates a NEW activity with corrected inputs
      // (Cannot modify REJECTED activity, must create new one)
      const newActivityResponse = await request(app)
        .post(`/work-orders/${workOrderId}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          type: ActivityType.APLICACION,
          executionDate: new Date('2025-08-03').toISOString(),
          hoursWorked: 8,
          details: {
            notes: 'Corrected amounts and added herbicide',
            weather: 'Sunny',
          },
          inputsUsed: [
            {
              inputId: fertilizante.id,
              quantityUsed: 45.0, // Corrected amount
            },
            {
              inputId: pesticida.id,
              quantityUsed: 12.0, // Corrected amount
            },
            {
              inputId: herbicida.id, // Added new input
              quantityUsed: 5.0,
            },
          ],
        });

      expect(newActivityResponse.status).toBe(201);
      const newActivityId = newActivityResponse.body.data.id;
      expect(newActivityResponse.body.data.hoursWorked).toBe(8);
      expect(newActivityResponse.body.data.inputsUsed).toHaveLength(3);
      expect(newActivityResponse.body.data.status).toBe(ActivityStatus.PENDING);

      // Step 5: CAPATAZ approves the new corrected activity
      const approveActivityResponse = await request(app)
        .put(`/activities/${newActivityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      expect(approveActivityResponse.status).toBe(200);
      expect(approveActivityResponse.body.data.status).toBe(ActivityStatus.APPROVED);
      expect(approveActivityResponse.body.data.inputsUsed).toHaveLength(3);

      // Step 6: ADMIN views activities to verify both exist (rejected and approved)
      const getActivityResponse = await request(app)
        .get('/activities')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(getActivityResponse.status).toBe(200);
      
      // Original rejected activity should still exist
      const rejectedActivity = getActivityResponse.body.data.find((a: any) => a.id === activityId);
      expect(rejectedActivity).toBeTruthy();
      expect(rejectedActivity.status).toBe(ActivityStatus.REJECTED);
      expect(rejectedActivity.inputsUsed).toHaveLength(2);
      
      // New approved activity should exist with corrected inputs
      const approvedActivity = getActivityResponse.body.data.find((a: any) => a.id === newActivityId);
      expect(approvedActivity).toBeTruthy();
      expect(approvedActivity.status).toBe(ActivityStatus.APPROVED);
      expect(approvedActivity.inputsUsed).toHaveLength(3);

      const fertUsage = approvedActivity.inputsUsed.find((u: any) => u.inputId === fertilizante.id);
      const pestUsage = approvedActivity.inputsUsed.find((u: any) => u.inputId === pesticida.id);
      const herbUsage = approvedActivity.inputsUsed.find((u: any) => u.inputId === herbicida.id);

      expect(fertUsage.quantityUsed).toBe(45.0);
      expect(pestUsage.quantityUsed).toBe(12.0);
      expect(herbUsage.quantityUsed).toBe(5.0);

      // Step 7: CAPATAZ marks work order as completed
      const completeWOResponse = await request(app)
        .put(`/work-orders/${workOrderId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: WorkOrderStatus.COMPLETED,
          completedDate: new Date('2025-08-15').toISOString(),
        });

      expect(completeWOResponse.status).toBe(200);
      expect(completeWOResponse.body.data.status).toBe(WorkOrderStatus.COMPLETED);

      // Verify final state in database - check the NEW approved activity
      const activityRepository = dataSource.getRepository(Activity);
      const finalActivity = await activityRepository.findOne({
        where: { id: newActivityId },
        relations: ['inputsUsed', 'inputsUsed.input'],
      });

      expect(finalActivity).toBeTruthy();
      expect(finalActivity!.status).toBe(ActivityStatus.APPROVED);
      expect(finalActivity!.inputsUsed).toHaveLength(3);
      expect(finalActivity!.hoursWorked).toBe(8);

      const inputUsageRepository = dataSource.getRepository(InputUsage);
      const allUsages = await inputUsageRepository.find({
        where: { activityId: newActivityId },
        relations: ['input'],
      });

      expect(allUsages).toHaveLength(3);
      const names = allUsages.map((u) => u.input.name).sort();
      expect(names).toEqual([
        'Fertilizante Complete Test',
        'Herbicida Complete Test',
        'Pesticida Complete Test',
      ]);
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

      // Step 3: OPERARIO cannot update rejected activity, must create a new one
      const tryUpdateResponse = await request(app)
        .put(`/activities/${activityId}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          hoursWorked: 5,
        });

      expect(tryUpdateResponse.status).toBe(403);
      expect(tryUpdateResponse.body.errors[0].message).toContain('rechazada');
      expect(tryUpdateResponse.body.errors[0].message).toContain('nueva actividad');

      // Step 4: OPERARIO creates a NEW activity with corrections
      const newActivityResponse = await request(app)
        .post(`/work-orders/${scenario.assignedWorkOrder.id}/activities`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          type: ActivityType.RIEGO,
          executionDate: new Date('2025-06-10').toISOString(),
          hoursWorked: 5, // Corrected hours
          details: {
            notes: 'Corrected hours after feedback',
          },
        });

      expect(newActivityResponse.status).toBe(201);
      const newActivityId = newActivityResponse.body.data.id;
      expect(newActivityResponse.body.data.hoursWorked).toBe(5);

      // Step 5: CAPATAZ approves the new activity
      const approveResponse = await request(app)
        .put(`/activities/${newActivityId}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          status: ActivityStatus.APPROVED,
        });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.status).toBe(ActivityStatus.APPROVED);

      // Verify final state - both activities exist
      const activityRepository = dataSource.getRepository(Activity);
      
      // Original rejected activity
      const rejectedActivity = await activityRepository.findOne({
        where: { id: activityId },
      });
      expect(rejectedActivity).toBeTruthy();
      expect(rejectedActivity!.status).toBe(ActivityStatus.REJECTED);
      expect(rejectedActivity!.hoursWorked).toBe(3);

      // New approved activity
      const approvedActivity = await activityRepository.findOne({
        where: { id: newActivityId },
      });
      expect(approvedActivity).toBeTruthy();
      expect(approvedActivity!.status).toBe(ActivityStatus.APPROVED);
      expect(approvedActivity!.hoursWorked).toBe(5);
    });
  });
});


