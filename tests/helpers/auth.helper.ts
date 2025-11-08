import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '@/entities/user.entity';
import { UserRole } from '@/enums';
import { ENV } from '@/config/environment';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: UserRole;
  password: string; // Plain text for testing
  token: string;
}

/**
 * Creates a test user in the database
 */
export const createTestUser = async (
  dataSource: DataSource,
  data: {
    email: string;
    name: string;
    lastName: string;
    role: UserRole;
    password: string;
    hourlyRate?: number;
  }
): Promise<TestUser> => {
  const userRepository = dataSource.getRepository(User);
  
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  const user = userRepository.create({
    email: data.email,
    name: data.name,
    lastName: data.lastName,
    role: data.role,
    passwordHash,
    hourlyRate: data.hourlyRate || 0,
  });

  const savedUser = await userRepository.save(user);
  
  const token = generateToken(savedUser.id, savedUser.role);

  return {
    id: savedUser.id,
    email: savedUser.email,
    name: savedUser.name,
    lastName: savedUser.lastName,
    role: savedUser.role,
    password: data.password,
    token,
  };
};

/**
 * Generates a JWT token for a user
 */
export const generateToken = (userId: string, role: UserRole): string => {
  return jwt.sign(
    { userId, role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

/**
 * Creates standard test users: Admin, Capataz, and Operario
 */
export const createStandardTestUsers = async (dataSource: DataSource) => {
  const admin = await createTestUser(dataSource, {
    email: 'admin@test.com',
    name: 'Admin User',
    lastName: 'Test',
    role: UserRole.ADMIN,
    password: 'admin123',
    hourlyRate: 50,
  });

  const capataz = await createTestUser(dataSource, {
    email: 'capataz@test.com',
    name: 'Capataz A',
    lastName: 'Test',
    role: UserRole.CAPATAZ,
    password: 'capataz123',
    hourlyRate: 30,
  });

  const operario = await createTestUser(dataSource, {
    email: 'operario@test.com',
    name: 'Operario A',
    lastName: 'Test',
    role: UserRole.OPERARIO,
    password: 'operario123',
    hourlyRate: 20,
  });

  return { admin, capataz, operario };
};
