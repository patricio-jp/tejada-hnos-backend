import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser, createTestUser } from '../helpers/auth.helper';
import {
  setupHarvestScenario,
  createTestHarvestLot,
  createTestField,
  createTestPlot,
  createTestVariety,
} from '../helpers/fixtures.helper';
import { HarvestLot } from '@/entities/harvest-lot.entity';
import { UserRole, HarvestLotStatus, WalnutCaliber } from '@/enums';

describe('E2E: Harvest Lots Flow', () => {
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

  describe('POST /harvest-lots - Create harvest lot', () => {
    it('should allow ADMIN to create a harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-20',
          lotCode: 'LOT-ADMIN-001',
          varietyName: 'Chandler',
          grossWeightKg: 1500,
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.plotId).toBe(scenario.plot.id);
      expect(response.body.data.varietyName).toBe('Chandler');
      expect(response.body.data.grossWeightKg).toBe(1500);
      expect(response.body.data.status).toBe(HarvestLotStatus.PENDIENTE_PROCESO);
      expect(response.body.data.netWeightKg).toBeNull();
      expect(response.body.data.caliber).toBeNull();
    });

    it('should allow CAPATAZ to create a harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-21',
          lotCode: 'LOT-CAPATAZ-001',
          varietyName: 'Serr',
          grossWeightKg: 2000,
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.varietyName).toBe('Serr');
      expect(response.body.data.grossWeightKg).toBe(2000);
      expect(response.body.data.status).toBe(HarvestLotStatus.PENDIENTE_PROCESO);
    });

    it('should NOT allow OPERARIO to create a harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-22',
          grossWeightKg: 1000,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          // Missing required fields
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should validate grossWeightKg must be positive', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-20',
          grossWeightKg: 0,
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should create harvest lot without lotCode and varietyName (to be set later)', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-20',
          lotCode: 'LOT-NO-VARIETY',
          varietyName: 'Sin Clasificar',
          grossWeightKg: 800,
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.grossWeightKg).toBe(800);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/harvest-lots')
        .send({
          harvestDate: '2025-03-20',
          grossWeightKg: 1000,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /harvest-lots - List harvest lots', () => {
    it('should allow ADMIN to see all harvest lots', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
      
      const lotIds = response.body.data.map((lot: any) => lot.id);
      expect(lotIds).toContain(scenario.pendingLot.id);
      expect(lotIds).toContain(scenario.inStockLot.id);
    });

    it('should allow CAPATAZ to see all harvest lots', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/harvest-lots')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter harvest lots by plotId', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      
      // Create another plot and harvest lot
      const anotherField = await createTestField(dataSource, {
        name: 'Campo Otro',
        area: 50,
        address: 'Address 2',
        managerId: capataz.id,
      });
      const anotherPlot = await createTestPlot(dataSource, {
        name: 'Parcela Otra',
        area: 15,
        fieldId: anotherField.id,
      });
      const anotherLot = await createTestHarvestLot(dataSource, {
        plotId: anotherPlot.id,
        harvestDate: new Date('2025-03-25'),
        grossWeightKg: 500,
      });

      // Act
      const response = await request(app)
        .get(`/harvest-lots?plotId=${scenario.plot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      const lotIds = response.body.data.map((lot: any) => lot.id);
      expect(lotIds).toContain(scenario.pendingLot.id);
      expect(lotIds).toContain(scenario.inStockLot.id);
      expect(lotIds).not.toContain(anotherLot.id);
    });

    it('should filter harvest lots by status', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/harvest-lots?status=${HarvestLotStatus.EN_STOCK}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      const lotIds = response.body.data.map((lot: any) => lot.id);
      expect(lotIds).toContain(scenario.inStockLot.id);
      expect(lotIds).not.toContain(scenario.pendingLot.id);
    });

    it('should filter harvest lots by varietyName', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/harvest-lots?varietyName=Serr')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((lot: any) => {
        expect(lot.varietyName).toBe('Serr');
      });
    });

    it('should filter harvest lots by weight range', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/harvest-lots?minGrossWeight=1500&maxGrossWeight=2500')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      response.body.data.forEach((lot: any) => {
        expect(lot.grossWeightKg).toBeGreaterThanOrEqual(1500);
        expect(lot.grossWeightKg).toBeLessThanOrEqual(2500);
      });
    });

    it('should filter harvest lots by date range', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get('/harvest-lots?startDate=2025-03-01&endDate=2025-03-20')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should NOT allow OPERARIO to list harvest lots', async () => {
      // Act
      const response = await request(app)
        .get('/harvest-lots')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/harvest-lots');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /harvest-lots/:id - Get harvest lot by ID', () => {
    it('should allow ADMIN to get harvest lot by ID', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/harvest-lots/${scenario.inStockLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.inStockLot.id);
      expect(response.body.data.status).toBe(HarvestLotStatus.EN_STOCK);
      expect(response.body.data.netWeightKg).toBe(1600);
      expect(response.body.data.caliber).toBe(WalnutCaliber.JUMBO);
    });

    it('should allow CAPATAZ to get harvest lot by ID', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.pendingLot.id);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .get('/harvest-lots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should NOT allow OPERARIO to get harvest lot details', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/harvest-lots/some-id');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /harvest-lots/:id - Update harvest lot', () => {
    it('should allow ADMIN to update harvest lot in PENDIENTE_PROCESO status', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Chandler',
          grossWeightKg: 1200,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.varietyName).toBe('Chandler');
      expect(response.body.data.grossWeightKg).toBe(1200);
    });

    it('should allow CAPATAZ to update harvest lot in PENDIENTE_PROCESO status', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          lotCode: 'LOT-UPDATED',
          grossWeightKg: 1100,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.lotCode).toBe('LOT-UPDATED');
      expect(response.body.data.grossWeightKg).toBe(1100);
    });

    it('should NOT allow updating harvest lot in EN_STOCK status', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/harvest-lots/${scenario.inStockLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          grossWeightKg: 2500,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain('EN_STOCK');
    });

    it('should NOT allow OPERARIO to update harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          grossWeightKg: 1300,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should validate grossWeightKg must be positive when updating', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .put(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          grossWeightKg: -100,
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .put('/harvest-lots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          grossWeightKg: 1000,
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .put('/harvest-lots/some-id')
        .send({ grossWeightKg: 1000 });
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /harvest-lots/:id/process - Process harvest lot', () => {
    it('should allow ADMIN to process harvest lot (PENDIENTE_PROCESO → EN_STOCK)', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 850,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(HarvestLotStatus.EN_STOCK);
      expect(response.body.data.netWeightKg).toBe(850);
      expect(response.body.data.remainingNetWeightKg).toBe(850);
      expect(response.body.data.caliber).toBe(WalnutCaliber.LARGE);
      expect(response.body.data.varietyName).toBe('Serr');
      expect(response.body.data).toHaveProperty('yieldPercentage');
    });

    it('should allow CAPATAZ to process harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({
          varietyName: 'Chandler',
          caliber: WalnutCaliber.JUMBO,
          netWeightKg: 900,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe(HarvestLotStatus.EN_STOCK);
      expect(response.body.data.caliber).toBe(WalnutCaliber.JUMBO);
    });

    it('should calculate yield percentage correctly', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      // pendingLot has grossWeightKg = 1000

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.MEDIUM,
          netWeightKg: 800, // 80% yield
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.yieldPercentage).toBe(80);
    });

    it('should NOT allow processing already processed harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      // inStockLot is already EN_STOCK

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.inStockLot.id}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 1500,
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toContain('PENDIENTE_PROCESO');
    });

    it('should validate required fields for processing', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act - Missing varietyName
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 850,
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should validate netWeightKg must be positive', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 0,
        });

      // Assert
      expect(response.status).toBe(400);
    });

    it('should NOT allow OPERARIO to process harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/process`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 850,
        });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .patch('/harvest-lots/00000000-0000-0000-0000-000000000000/process')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 850,
        });

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .patch('/harvest-lots/some-id/process')
        .send({
          varietyName: 'Serr',
          caliber: WalnutCaliber.LARGE,
          netWeightKg: 850,
        });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /harvest-lots/:id - Soft delete harvest lot', () => {
    it('should allow ADMIN to soft delete harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('deletedAt');
      expect(response.body.canRestore).toBe(true);

      // Verify it's not in regular listing
      const listResponse = await request(app)
        .get('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`);
      
      const lotIds = listResponse.body.data.map((lot: any) => lot.id);
      expect(lotIds).not.toContain(scenario.pendingLot.id);
    });

    it('should NOT allow CAPATAZ to delete harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should NOT allow OPERARIO to delete harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .delete('/harvest-lots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/harvest-lots/some-id');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /harvest-lots/:id/restore - Restore harvest lot', () => {
    it('should allow ADMIN to restore soft-deleted harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      
      // First delete
      await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Act - Restore
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/restore`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(scenario.pendingLot.id);
      expect(response.body.data.deletedAt).toBeNull();

      // Verify it's back in regular listing
      const listResponse = await request(app)
        .get('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`);
      
      const lotIds = listResponse.body.data.map((lot: any) => lot.id);
      expect(lotIds).toContain(scenario.pendingLot.id);
    });

    it('should NOT allow CAPATAZ to restore harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      
      await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Act
      const response = await request(app)
        .patch(`/harvest-lots/${scenario.pendingLot.id}/restore`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .patch('/harvest-lots/00000000-0000-0000-0000-000000000000/restore')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).patch('/harvest-lots/some-id/restore');
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /harvest-lots/:id/permanent - Hard delete harvest lot', () => {
    it('should allow ADMIN to permanently delete harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      const lotId = scenario.pendingLot.id;

      // Act
      const response = await request(app)
        .delete(`/harvest-lots/${lotId}/permanent`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.canRestore).toBe(false);

      // Verify it's completely gone
      const getResponse = await request(app)
        .get(`/harvest-lots/${lotId}`)
        .set('Authorization', `Bearer ${admin.token}`);
      
      expect(getResponse.status).toBe(404);
    });

    it('should NOT allow CAPATAZ to permanently delete harvest lot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .delete(`/harvest-lots/${scenario.pendingLot.id}/permanent`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent harvest lot', async () => {
      // Act
      const response = await request(app)
        .delete('/harvest-lots/00000000-0000-0000-0000-000000000000/permanent')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).delete('/harvest-lots/some-id/permanent');
      expect(response.status).toBe(401);
    });
  });

  describe('Business Logic Tests', () => {
    it('should track harvest lot lifecycle: create → update → process → stock', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Step 1: Create new harvest lot (PENDIENTE_PROCESO)
      const createResponse = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-03-25',
          lotCode: 'LOT-LIFECYCLE-TEMP',
          varietyName: 'Sin Clasificar',
          grossWeightKg: 3000,
        });

      expect(createResponse.status).toBe(201);
      const lotId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe(HarvestLotStatus.PENDIENTE_PROCESO);

      // Step 2: Update lot while PENDIENTE_PROCESO
      const updateResponse = await request(app)
        .put(`/harvest-lots/${lotId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          lotCode: 'LOT-LIFECYCLE-001',
          varietyName: 'Chandler',
          grossWeightKg: 3200,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.lotCode).toBe('LOT-LIFECYCLE-001');

      // Step 3: Process lot (PENDIENTE_PROCESO → EN_STOCK)
      const processResponse = await request(app)
        .patch(`/harvest-lots/${lotId}/process`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Chandler',
          caliber: WalnutCaliber.JUMBO,
          netWeightKg: 2700,
        });

      expect(processResponse.status).toBe(200);
      expect(processResponse.body.data.status).toBe(HarvestLotStatus.EN_STOCK);
      expect(processResponse.body.data.netWeightKg).toBe(2700);
      expect(processResponse.body.data.remainingNetWeightKg).toBe(2700);
      
      // Calculate expected yield: (2700 / 3200) * 100 = 84.375
      expect(processResponse.body.data.yieldPercentage).toBeCloseTo(84.38, 1);

      // Step 4: Verify cannot update after EN_STOCK
      const updateAfterStockResponse = await request(app)
        .put(`/harvest-lots/${lotId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          grossWeightKg: 3500,
        });

      expect(updateAfterStockResponse.status).toBe(400);
    });

    it('should ensure immutability of EN_STOCK harvest lots', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);
      // inStockLot is already EN_STOCK

      // Act - Try to update
      const updateResponse = await request(app)
        .put(`/harvest-lots/${scenario.inStockLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          varietyName: 'Changed',
          netWeightKg: 999,
        });

      // Assert
      expect(updateResponse.status).toBe(400);

      // Verify data hasn't changed
      const getResponse = await request(app)
        .get(`/harvest-lots/${scenario.inStockLot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(getResponse.body.data.varietyName).toBe('Serr'); // Original value
      expect(getResponse.body.data.netWeightKg).toBe(1600); // Original value
    });

    it('should handle multiple harvest lots from same plot', async () => {
      // Arrange
      const scenario = await setupHarvestScenario(dataSource, capataz.id);

      // Create multiple lots from same plot
      const lot1Response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-04-01',
          lotCode: 'LOT-MULTI-001',
          varietyName: 'Chandler',
          grossWeightKg: 500,
        });

      const lot2Response = await request(app)
        .post('/harvest-lots')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          plotId: scenario.plot.id,
          harvestDate: '2025-04-15',
          lotCode: 'LOT-MULTI-002',
          varietyName: 'Serr',
          grossWeightKg: 600,
        });

      expect(lot1Response.status).toBe(201);
      expect(lot2Response.status).toBe(201);

      // Get all lots from this plot
      const listResponse = await request(app)
        .get(`/harvest-lots?plotId=${scenario.plot.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.length).toBeGreaterThanOrEqual(4); // 2 from setup + 2 new
    });
  });
});
