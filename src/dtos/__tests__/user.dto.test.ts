import { describe, expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { CreateUserDto, UpdateUserDto } from '../user.dto';
import { UserRole } from '../../enums';

describe('User DTOs', () => {
  describe('CreateUserDto', () => {
    it('should validate correct user data', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.password = 'Password123!';
      dto.name = 'Test';
      dto.lastName = 'User';
      dto.role = UserRole.OPERARIO;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid email', async () => {
      const dto = new CreateUserDto();
      dto.email = 'invalid-email';
      dto.password = 'Password123!';
      dto.name = 'Test';
      dto.lastName = 'User';
      dto.role = UserRole.OPERARIO;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find(e => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateUserDto', () => {
    it('should validate partial update', async () => {
      const dto = new UpdateUserDto();
      dto.name = 'Updated Name';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow empty dto for partial update', async () => {
      const dto = new UpdateUserDto();

      const errors = await validate(dto, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });
  });
});
