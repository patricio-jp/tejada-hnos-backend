import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";
import { TestDataSource, initializeTestDatabase, cleanupTestDatabase, clearDatabase } from "../../config/typeorm.config";
import { AuthService } from "../auth.service";
import { User } from "../../entities/user.entity";
import { UserRole } from "../../enums";
import bcrypt from "bcrypt";
import { JwtUtils } from "../../utils/jwt.utils";

// Setup global antes de todos los tests
beforeAll(async () => {
  await initializeTestDatabase();
});

// Cleanup global después de todos los tests
afterAll(async () => {
  await cleanupTestDatabase();
});

describe('AuthService E2E Tests', () => {
  let authService: AuthService;
  let userRepository: any;

  beforeEach(async () => {
    // Limpiar la base de datos entre tests
    await clearDatabase();
    
    // Obtener el repository real
    userRepository = TestDataSource.getRepository(User);
    
    // Crear el servicio con el DataSource real
    authService = new AuthService(TestDataSource);
  });

  describe('login', () => {
    it('debe autenticar usuario con credenciales válidas', async () => {
      // ARRANGE - Crear un usuario real en la DB
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(user);

      // ACT - Intentar login
      const result = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // ASSERT
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test');
      expect(result.user.lastName).toBe('User');
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(result.user.id).toBe(user.id);
      
      // Verificar que el passwordHash no se incluya
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('debe fallar con email inexistente', async () => {
      // ACT & ASSERT
      await expect(
        authService.login({
          email: 'noexiste@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe fallar con contraseña incorrecta', async () => {
      // ARRANGE
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.OPERARIO,
      });
      await userRepository.save(user);

      // ACT & ASSERT
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe generar tokens JWT válidos', async () => {
      // ARRANGE
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(user);

      // ACT
      const result = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // ASSERT - Verificar que los tokens son válidos
      const accessPayload = JwtUtils.verifyAccessToken(result.accessToken);
      expect(accessPayload.userId).toBe(user.id);
      expect(accessPayload.email).toBe('test@example.com');
      expect(accessPayload.role).toBe(UserRole.ADMIN);
      expect(accessPayload.name).toBe('Test');
      expect(accessPayload.lastName).toBe('User');

      const refreshPayload = JwtUtils.verifyRefreshToken(result.refreshToken);
      expect(refreshPayload.userId).toBe(user.id);
      expect(refreshPayload.email).toBe('test@example.com');
    });

    it('debe manejar múltiples usuarios correctamente', async () => {
      // ARRANGE - Crear múltiples usuarios
      const password1 = await bcrypt.hash('Password1!', 10);
      const password2 = await bcrypt.hash('Password2!', 10);
      
      const user1 = userRepository.create({
        email: 'admin@example.com',
        name: 'Admin',
        lastName: 'User',
        passwordHash: password1,
        role: UserRole.ADMIN,
      });
      
      const user2 = userRepository.create({
        email: 'operario@example.com',
        name: 'Operario',
        lastName: 'User',
        passwordHash: password2,
        role: UserRole.OPERARIO,
      });

      await userRepository.save([user1, user2]);

      // ACT - Login con cada usuario
      const result1 = await authService.login({
        email: 'admin@example.com',
        password: 'Password1!',
      });

      const result2 = await authService.login({
        email: 'operario@example.com',
        password: 'Password2!',
      });

      // ASSERT
      expect(result1.user.role).toBe(UserRole.ADMIN);
      expect(result1.user.email).toBe('admin@example.com');
      
      expect(result2.user.role).toBe(UserRole.OPERARIO);
      expect(result2.user.email).toBe('operario@example.com');
    });
  });

  describe('refreshToken', () => {
    it('debe generar nuevos tokens con refresh token válido', async () => {
      // ARRANGE - Crear usuario y hacer login inicial
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(user);

      const loginResult = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // Pequeño delay para asegurar que el timestamp del token sea diferente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ACT - Usar refresh token para obtener nuevos tokens
      const refreshResult = await authService.refreshToken(loginResult.refreshToken);

      // ASSERT
      expect(refreshResult).toBeDefined();
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      
      // Los nuevos tokens deben ser diferentes
      expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
      expect(refreshResult.refreshToken).not.toBe(loginResult.refreshToken);

      // Verificar que el nuevo access token es válido
      const payload = JwtUtils.verifyAccessToken(refreshResult.accessToken);
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe('test@example.com');
    });

    it('debe fallar con refresh token inválido', async () => {
      // ACT & ASSERT
      await expect(
        authService.refreshToken('invalid-token')
      ).rejects.toThrow('Refresh token inválido o expirado');
    });

    it('debe fallar si el usuario fue eliminado después del login', async () => {
      // ARRANGE - Crear usuario y hacer login
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(user);

      const loginResult = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // Eliminar el usuario
      await userRepository.remove(user);

      // ACT & ASSERT
      await expect(
        authService.refreshToken(loginResult.refreshToken)
      ).rejects.toThrow('Refresh token inválido o expirado');
    });
  });

  describe('verifyAccessToken', () => {
    it('debe verificar correctamente un access token válido', async () => {
      // ARRANGE - Crear usuario y hacer login
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(user);

      const loginResult = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // ACT
      const payload = authService.verifyAccessToken(loginResult.accessToken);

      // ASSERT
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe(UserRole.ADMIN);
      expect(payload.name).toBe('Test');
      expect(payload.lastName).toBe('User');
    });

    it('debe rechazar un token inválido', () => {
      // ACT & ASSERT
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('Flujo completo de autenticación', () => {
    it('debe permitir login -> verificar token -> refresh -> verificar nuevo token', async () => {
      // ARRANGE - Crear usuario
      const testPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      const user = userRepository.create({
        email: 'test@example.com',
        name: 'Test',
        lastName: 'User',
        passwordHash: hashedPassword,
        role: UserRole.OPERARIO,
      });
      await userRepository.save(user);

      // ACT 1 - Login
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: testPassword,
      });

      // ASSERT 1
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user.email).toBe('test@example.com');

      // ACT 2 - Verificar access token
      const payload1 = authService.verifyAccessToken(loginResult.accessToken);
      
      // ASSERT 2
      expect(payload1.userId).toBe(user.id);

      // Pequeño delay para asegurar que el timestamp del token sea diferente
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ACT 3 - Refresh token
      const refreshResult = await authService.refreshToken(loginResult.refreshToken);
      
      // ASSERT 3
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);

      // ACT 4 - Verificar nuevo access token
      const payload2 = authService.verifyAccessToken(refreshResult.accessToken);
      
      // ASSERT 4
      expect(payload2.userId).toBe(user.id);
      expect(payload2.email).toBe('test@example.com');
    });
  });
});
