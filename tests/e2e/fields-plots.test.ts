import request from 'supertest';
import { Express } from 'express';
import { DataSource } from 'typeorm';
import { createTestDataSource, clearDatabase, closeTestDataSource } from '../helpers/database.helper';
import { createTestApp } from '../helpers/app.helper';
import { createStandardTestUsers, TestUser, createTestUser } from '../helpers/auth.helper';
import { createTestField, createTestPlot, setupFieldPlotScenario } from '../helpers/fixtures.helper';
import { Field } from '@/entities/field.entity';
import { Plot } from '@/entities/plot.entity';
import { UserRole } from '@/enums';

describe('E2E: Fields and Plots Flow', () => {
  let app: Express;
  let dataSource: DataSource;
  let admin: TestUser;
  let capataz: TestUser;
  let capatazB: TestUser; // Second capataz for cross-user tests
  let operario: TestUser;
  let operarioB: TestUser; // Second operario for cross-user tests

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

    // Create additional users for cross-user permission tests
    capatazB = await createTestUser(dataSource, {
      email: 'capatazB@test.com',
      name: 'CapatazB',
      lastName: 'Test',
      role: UserRole.CAPATAZ,
      password: 'capatazB123',
      hourlyRate: 30,
    });

    operarioB = await createTestUser(dataSource, {
      email: 'operarioB@test.com',
      name: 'OperarioB',
      lastName: 'Test',
      role: UserRole.OPERARIO,
      password: 'operarioB123',
      hourlyRate: 20,
    });
  });

  describe('GET /fields - List all fields', () => {
    it('should allow ADMIN to see all fields with full details (no filters)', async () => {
      // Arrange: Create multiple fields
      await createTestField(dataSource, {
        name: 'Campo Admin 1',
        area: 100,
        address: 'Address 1',
        managerId: null,
      });
      await createTestField(dataSource, {
        name: 'Campo Admin 2',
        area: 150,
        address: 'Address 2',
        managerId: capataz.id,
      });

      // Act: ADMIN without filters gets full details (because role is ADMIN)
      const response = await request(app)
        .get('/fields')
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert: ADMIN always gets full details
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('area'); // Full details for ADMIN
      expect(response.body.data[0]).toHaveProperty('address');
      expect(response.body.data[0]).toHaveProperty('location');
    });

    it('should allow CAPATAZ to see all fields with map data only (no filters)', async () => {
      // Arrange
      const managedField = await createTestField(dataSource, {
        name: 'Campo Gestionado',
        area: 100,
        address: 'Address 1',
        managerId: capataz.id,
      });

      const unmanagedField = await createTestField(dataSource, {
        name: 'Campo No Gestionado',
        area: 150,
        address: 'Address 2',
        managerId: null,
      });

      // Act: CAPATAZ without filters gets only map data
      const response = await request(app)
        .get('/fields')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Returns all fields but with limited data (for map rendering)
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Verify both fields are included
      const fieldIds = response.body.data.map((f: any) => f.id);
      expect(fieldIds).toContain(managedField.id);
      expect(fieldIds).toContain(unmanagedField.id);

      // Verify only map data is returned (id, name, location)
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('location');
      expect(response.body.data[0]).not.toHaveProperty('area'); // No area in map-only response
      expect(response.body.data[0]).not.toHaveProperty('address'); // No address in map-only response
    });

    it('should allow CAPATAZ to see managed fields with full details (with filters)', async () => {
      // Arrange
      const managedField1 = await createTestField(dataSource, {
        name: 'Campo Gestionado 1',
        area: 100,
        address: 'Address 1',
        managerId: capataz.id,
      });

      const managedField2 = await createTestField(dataSource, {
        name: 'Campo Gestionado 2',
        area: 150,
        address: 'Address 2',
        managerId: capataz.id,
      });

      const unmanagedField = await createTestField(dataSource, {
        name: 'Campo No Gestionado',
        area: 200,
        address: 'Address 3',
        managerId: capatazB.id,
      });

      // Act: CAPATAZ with managerId filter gets full details (only managed fields)
      const response = await request(app)
        .get(`/fields?managerId=${capataz.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Returns only managed fields with full details
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      
      // Verify only managed fields are included
      const fieldIds = response.body.data.map((f: any) => f.id);
      expect(fieldIds).toContain(managedField1.id);
      expect(fieldIds).toContain(managedField2.id);
      expect(fieldIds).not.toContain(unmanagedField.id);

      // Verify full details are returned
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('location');
      expect(response.body.data[0]).toHaveProperty('area'); // Full details with filters
      expect(response.body.data[0]).toHaveProperty('address'); // Full details with filters
      expect(response.body.data[0]).toHaveProperty('manager'); // Full details with filters
    });

    it('should ensure CAPATAZ_A and CAPATAZ_B see all fields (map data) but only their managed fields with full details', async () => {
      // Arrange: Create fields for different capataces
      const fieldA1 = await createTestField(dataSource, {
        name: 'Campo A1',
        area: 100,
        address: 'Address A1',
        managerId: capataz.id,
      });

      const fieldA2 = await createTestField(dataSource, {
        name: 'Campo A2',
        area: 120,
        address: 'Address A2',
        managerId: capataz.id,
      });

      const fieldB1 = await createTestField(dataSource, {
        name: 'Campo B1',
        area: 150,
        address: 'Address B1',
        managerId: capatazB.id,
      });

      const fieldUnmanaged = await createTestField(dataSource, {
        name: 'Campo Sin Gestor',
        area: 80,
        address: 'Address Unmanaged',
        managerId: null,
      });

      // Act: Get all fields for Capataz A (no filters → map data only)
      // Act 2: Get all fields for Capataz A (returns both managed and unmanaged fields with appropriate detail levels)
      const responseA_All = await request(app)
        .get('/fields')
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Capataz A sees all fields with map data only
      expect(responseA_All.status).toBe(200);
      expect(responseA_All.body.data.length).toBeGreaterThanOrEqual(4);
      const fieldIdsA_All = responseA_All.body.data.map((f: any) => f.id);
      expect(fieldIdsA_All).toContain(fieldA1.id);
      expect(fieldIdsA_All).toContain(fieldA2.id);
      expect(fieldIdsA_All).toContain(fieldB1.id);
      expect(fieldIdsA_All).toContain(fieldUnmanaged.id);
      expect(responseA_All.body.data[0]).not.toHaveProperty('area'); // Map data only

      // Assert: Capataz A sees unmanaged fields with map data only
      const unmanagedsFieldA = responseA_All.body.data.map((f: any) => f.id).filter((f: string) => fieldUnmanaged.id === f || f === fieldB1.id);
      expect(unmanagedsFieldA).toHaveLength(2);
      unmanagedsFieldA.forEach((fieldId: string) => {
        const fieldData = responseA_All.body.data.find((f: any) => f.id === fieldId);
        expect(fieldData).not.toHaveProperty('area'); // Map data only
      });

      // Assert: Capataz A sees managed fields with full details
      const managedFieldsA = responseA_All.body.data.map((f: any) => f.id).filter((f: string) => f === fieldA1.id || f === fieldA2.id);
      expect(managedFieldsA).toHaveLength(2);
      managedFieldsA.forEach((fieldId: string) => {
        const fieldData = responseA_All.body.data.find((f: any) => f.id === fieldId);
        expect(fieldData).toHaveProperty('area'); // Full details
      });

      // Act: Get managed fields for Capataz A (with filter → full details)
      const responseA_Managed = await request(app)
        .get(`/fields?managerId=${capataz.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Capataz A sees only their managed fields with full details
      expect(responseA_Managed.status).toBe(200);
      expect(responseA_Managed.body.data).toHaveLength(2);
      const fieldIdsA_Managed = responseA_Managed.body.data.map((f: any) => f.id);
      expect(fieldIdsA_Managed).toContain(fieldA1.id);
      expect(fieldIdsA_Managed).toContain(fieldA2.id);
      expect(fieldIdsA_Managed).not.toContain(fieldB1.id);
      expect(responseA_Managed.body.data[0]).toHaveProperty('area'); // Full details

      // Act: Get all fields for Capataz B (no filters → map data only)
      const responseB_All = await request(app)
        .get('/fields')
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Capataz B sees all fields with map data only
      expect(responseB_All.status).toBe(200);
      expect(responseB_All.body.data.length).toBeGreaterThanOrEqual(4);
      const fieldIdsB_All = responseB_All.body.data.map((f: any) => f.id);
      expect(fieldIdsB_All).toContain(fieldA1.id);
      expect(fieldIdsB_All).toContain(fieldA2.id);
      expect(fieldIdsB_All).toContain(fieldB1.id);
      expect(fieldIdsB_All).toContain(fieldUnmanaged.id);
      expect(responseB_All.body.data[0]).not.toHaveProperty('area'); // Map data only

      // Act: Get managed fields for Capataz B (with filter → full details)
      const responseB_Managed = await request(app)
        .get(`/fields?managerId=${capatazB.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Capataz B sees only their managed fields with full details
      expect(responseB_Managed.status).toBe(200);
      expect(responseB_Managed.body.data).toHaveLength(1);
      expect(responseB_Managed.body.data[0].id).toBe(fieldB1.id);
      expect(responseB_Managed.body.data[0]).toHaveProperty('area'); // Full details
    });

    it('should allow OPERARIO to see all fields with map data only (no filters)', async () => {
      // Arrange: Create fields
      const field1 = await createTestField(dataSource, {
        name: 'Campo 1',
        area: 100,
        address: 'Address 1',
        managerId: capataz.id,
      });

      const field2 = await createTestField(dataSource, {
        name: 'Campo 2',
        area: 150,
        address: 'Address 2',
        managerId: null,
      });

      // Act: OPERARIO without filters gets only map data
      const response = await request(app)
        .get('/fields')
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert: OPERARIO sees all fields with map data only
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      const fieldIds = response.body.data.map((f: any) => f.id);
      expect(fieldIds).toContain(field1.id);
      expect(fieldIds).toContain(field2.id);

      // Verify only map data is returned
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('location');
      expect(response.body.data[0]).not.toHaveProperty('area'); // No area in map-only response
      expect(response.body.data[0]).not.toHaveProperty('address'); // No address in map-only response
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/fields');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /fields/:id - Get field by ID', () => {
    it('should allow ADMIN to get any field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      // Act
      const response = await request(app)
        .get(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(field.id);
      expect(response.body.data.name).toBe('Test Field');
    });

    it('should allow CAPATAZ to get managed field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Managed Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      // Act
      const response = await request(app)
        .get(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(field.id);
    });

    it('should deny CAPATAZ access to unmanaged field details', async () => {
      // Arrange: Create unmanaged field
      const field = await createTestField(dataSource, {
        name: 'Unmanaged Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      // Act: CAPATAZ tries to access field they don't manage
      const response = await request(app)
        .get(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: Should be blocked from viewing details
      expect(response.status).toBe(403);
      expect(response.body.errors[0].message).toContain('No tienes permisos para ver los detalles de este campo');
    });

    it('should deny CAPATAZ_B access to CAPATAZ_A managed field details', async () => {
      // Arrange: Create field managed by capataz A
      const fieldManagedByA = await createTestField(dataSource, {
        name: 'Field Managed by Capataz A',
        area: 100,
        address: 'Test Address A',
        managerId: capataz.id,
      });

      // Act: CAPATAZ_B tries to access CAPATAZ_A's field details
      const response = await request(app)
        .get(`/fields/${fieldManagedByA.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`);

      // Assert: Should be blocked (can only see their own managed fields)
      expect(response.status).toBe(403);
      expect(response.body.errors[0].message).toContain('No tienes permisos para ver los detalles de este campo');
    });

    it('should allow each CAPATAZ to access only their own managed field details', async () => {
      // Arrange: Create fields for each capataz
      const fieldA = await createTestField(dataSource, {
        name: 'Field A',
        area: 100,
        address: 'Address A',
        managerId: capataz.id,
      });

      const fieldB = await createTestField(dataSource, {
        name: 'Field B',
        area: 150,
        address: 'Address B',
        managerId: capatazB.id,
      });

      // Act & Assert: Capataz A can access their own field details
      const responseA = await request(app)
        .get(`/fields/${fieldA.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);
      expect(responseA.status).toBe(200);
      expect(responseA.body.data.managerId).toBe(capataz.id);

      // Act & Assert: Capataz B can access field B
      const responseB = await request(app)
        .get(`/fields/${fieldB.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`);
      expect(responseB.status).toBe(200);
      expect(responseB.body.data.managerId).toBe(capatazB.id);

      // Act & Assert: Capataz A CANNOT access field B details (not managed by them)
      const responseCross1 = await request(app)
        .get(`/fields/${fieldB.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);
      expect(responseCross1.status).toBe(403);
      expect(responseCross1.body.errors[0].message).toContain('No tienes permisos para ver los detalles de este campo');

      // Act & Assert: Capataz B CANNOT access field A details (not managed by them)
      const responseCross2 = await request(app)
        .get(`/fields/${fieldA.id}`)
        .set('Authorization', `Bearer ${capatazB.token}`);
      expect(responseCross2.status).toBe(403);
      expect(responseCross2.body.errors[0].message).toContain('No tienes permisos para ver los detalles de este campo');
    });

    it('should deny OPERARIO access to field details', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      // Act: OPERARIO tries to access field details
      const response = await request(app)
        .get(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert: OPERARIO cannot view field details (not a manager)
      expect(response.status).toBe(403);
      expect(response.body.errors[0].message).toContain('No tienes permisos para ver los detalles de este campo');
    });
  });

  describe('POST /fields - Create field', () => {
    it('should allow ADMIN to create a field', async () => {
      // Arrange
      const fieldData = {
        name: 'New Field',
        area: 200,
        address: 'New Address',
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
        managerId: capataz.id,
      };

      // Act
      const response = await request(app)
        .post('/fields')
        .set('Authorization', `Bearer ${admin.token}`)
        .send(fieldData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('New Field');
      expect(response.body.data.managerId).toBe(capataz.id);

      // Verify in database
      const fieldRepository = dataSource.getRepository(Field);
      const savedField = await fieldRepository.findOne({ where: { id: response.body.data.id } });
      expect(savedField).toBeTruthy();
      expect(savedField!.name).toBe('New Field');
    });

    it('should deny CAPATAZ from creating a field', async () => {
      // Arrange
      const fieldData = {
        name: 'New Field',
        area: 200,
        address: 'New Address',
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
      };

      // Act
      const response = await request(app)
        .post('/fields')
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(fieldData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from creating a field', async () => {
      // Arrange
      const fieldData = {
        name: 'New Field',
        area: 200,
        address: 'New Address',
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
      };

      // Act
      const response = await request(app)
        .post('/fields')
        .set('Authorization', `Bearer ${operario.token}`)
        .send(fieldData);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /fields/:id - Update field', () => {
    it('should allow ADMIN to update any field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Original Name',
        area: 100,
        address: 'Original Address',
        managerId: null,
      });

      // Act
      const response = await request(app)
        .put(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Updated Name',
          area: 150,
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.area).toBe(150);

      // Verify in database
      const fieldRepository = dataSource.getRepository(Field);
      const updatedField = await fieldRepository.findOne({ where: { id: field.id } });
      expect(updatedField!.name).toBe('Updated Name');
    });

    it('should deny CAPATAZ from updating a field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      // Act
      const response = await request(app)
        .put(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send({ name: 'Updated Name' });

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from updating a field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      // Act
      const response = await request(app)
        .put(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send({ name: 'Updated Name' });

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /fields/:id - Soft delete field', () => {
    it('should allow ADMIN to soft delete a field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'To Delete',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      // Act
      const response = await request(app)
        .delete(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();

      // Verify in database (soft delete)
      const fieldRepository = dataSource.getRepository(Field);
      const deletedField = await fieldRepository.findOne({
        where: { id: field.id },
        withDeleted: true,
      });
      expect(deletedField).toBeTruthy();
      expect(deletedField!.deletedAt).toBeTruthy();
    });

    it('should deny CAPATAZ from deleting a field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      // Act
      const response = await request(app)
        .delete(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from deleting a field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      // Act
      const response = await request(app)
        .delete(`/fields/${field.id}`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('POST /fields/:fieldId/plots - Create plot in field', () => {
    it('should allow ADMIN to create a plot in any field', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      const plotData = {
        name: 'Plot A1',
        area: 25,
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
      };

      // Act
      const response = await request(app)
        .post(`/fields/${field.id}/plots`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(plotData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Plot A1');
      expect(response.body.data.fieldId).toBe(field.id);

      // Verify in database
      const plotRepository = dataSource.getRepository(Plot);
      const savedPlot = await plotRepository.findOne({ where: { id: response.body.data.id } });
      expect(savedPlot).toBeTruthy();
      expect(savedPlot!.fieldId).toBe(field.id);
    });

    it('should deny CAPATAZ from creating a plot', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: capataz.id,
      });

      const plotData = {
        name: 'Plot A1',
        area: 25,
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
      };

      // Act
      const response = await request(app)
        .post(`/fields/${field.id}/plots`)
        .set('Authorization', `Bearer ${capataz.token}`)
        .send(plotData);

      // Assert
      expect(response.status).toBe(403);
    });

    it('should deny OPERARIO from creating a plot', async () => {
      // Arrange
      const field = await createTestField(dataSource, {
        name: 'Test Field',
        area: 100,
        address: 'Test Address',
        managerId: null,
      });

      const plotData = {
        name: 'Plot A1',
        area: 25,
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [-70.6483, -33.4569],
              [-70.6482, -33.4569],
              [-70.6482, -33.4570],
              [-70.6483, -33.4570],
              [-70.6483, -33.4569],
            ],
          ],
        },
      };

      // Act
      const response = await request(app)
        .post(`/fields/${field.id}/plots`)
        .set('Authorization', `Bearer ${operario.token}`)
        .send(plotData);

      // Assert
      expect(response.status).toBe(403);
    });
  });

  describe('GET /fields/:fieldId/plots - List plots in field', () => {
    it('should allow ADMIN to get plots from any field', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/fields/${scenario.managedField.id}/plots`)
        .set('Authorization', `Bearer ${admin.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow CAPATAZ to get plots from managed field', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/fields/${scenario.managedField.id}/plots`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow CAPATAZ to get plots from any field (for map visualization)', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/fields/${scenario.unmanagedField.id}/plots`)
        .set('Authorization', `Bearer ${capataz.token}`);

      // Assert: CAPATAZ can view plots for map rendering
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow OPERARIO to access plots (for map visualization)', async () => {
      // Arrange
      const scenario = await setupFieldPlotScenario(dataSource, capataz.id);

      // Act
      const response = await request(app)
        .get(`/fields/${scenario.managedField.id}/plots`)
        .set('Authorization', `Bearer ${operario.token}`);

      // Assert: OPERARIO can view plots for map rendering
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Complete Field-Plot Workflow', () => {
    it('should allow complete CRUD workflow for ADMIN', async () => {
      // Step 1: Create field
      const createFieldResponse = await request(app)
        .post('/fields')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Workflow Field',
          area: 200,
          address: 'Workflow Address',
          location: {
            type: 'Polygon',
            coordinates: [
              [
                [-70.6483, -33.4569],
                [-70.6482, -33.4569],
                [-70.6482, -33.4570],
                [-70.6483, -33.4570],
                [-70.6483, -33.4569],
              ],
            ],
          },
          managerId: capataz.id,
        });

      expect(createFieldResponse.status).toBe(201);
      const fieldId = createFieldResponse.body.data.id;

      // Step 2: Create plot in field
      const createPlotResponse = await request(app)
        .post(`/fields/${fieldId}/plots`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Workflow Plot',
          area: 50,
          location: {
            type: 'Polygon',
            coordinates: [
              [
                [-70.6483, -33.4569],
                [-70.6482, -33.4569],
                [-70.6482, -33.4570],
                [-70.6483, -33.4570],
                [-70.6483, -33.4569],
              ],
            ],
          },
        });

      expect(createPlotResponse.status).toBe(201);
      const plotId = createPlotResponse.body.data.id;

      // Step 3: Get field details
      const getFieldResponse = await request(app)
        .get(`/fields/${fieldId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(getFieldResponse.status).toBe(200);
      expect(getFieldResponse.body.data.name).toBe('Workflow Field');

      // Step 4: Get plots in field
      const getPlotsResponse = await request(app)
        .get(`/fields/${fieldId}/plots`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(getPlotsResponse.status).toBe(200);
      expect(getPlotsResponse.body.data.length).toBeGreaterThan(0);

      // Step 5: Update field
      const updateFieldResponse = await request(app)
        .put(`/fields/${fieldId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          name: 'Updated Workflow Field',
        });

      expect(updateFieldResponse.status).toBe(200);
      expect(updateFieldResponse.body.data.name).toBe('Updated Workflow Field');

      // Step 6: Soft delete field
      const deleteFieldResponse = await request(app)
        .delete(`/fields/${fieldId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(deleteFieldResponse.status).toBe(200);
      expect(deleteFieldResponse.body.message).toBeDefined();

      // Step 7: Restore field
      const restoreFieldResponse = await request(app)
        .patch(`/fields/${fieldId}/restore`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(restoreFieldResponse.status).toBe(200);

      // Verify in database
      const fieldRepository = dataSource.getRepository(Field);
      const finalField = await fieldRepository.findOne({ where: { id: fieldId } });
      expect(finalField).toBeTruthy();
      expect(finalField!.deletedAt).toBeNull();
      expect(finalField!.name).toBe('Updated Workflow Field');
    });
  });
});
