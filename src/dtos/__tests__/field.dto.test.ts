import { describe, it, expect } from '@jest/globals';
import { validate } from "class-validator";
import { CreateFieldDto, UpdateFieldDto } from '../field.dto';

describe('FieldDTO', () => {
  describe('CreateFieldDto', () => {
    it('should validate correct field name', async () => {
      const fieldDto = new CreateFieldDto();
      fieldDto.name = 'Campo Norte';

      const errors = await validate(fieldDto);
      expect(errors.length).toBe(0);
    });

    it('should invalidate short field name', async () => {
      const fieldDto = new CreateFieldDto();
      fieldDto.name = 'Ca';

      const errors = await validate(fieldDto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should invalidate empty field name', async () => {
      const fieldDto = new CreateFieldDto();
      fieldDto.name = '';

      const errors = await validate(fieldDto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'name');
      expect(nameError).toBeDefined();
    });
  });

  describe('UpdateFieldDto', () => {
    it('should validate partial update with valid name', async () => {
      const fieldDto = new UpdateFieldDto();
      fieldDto.name = 'Campo Sur';

      const errors = await validate(fieldDto, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });

    it('should invalidate partial update with invalid name', async () => {
      const fieldDto = new UpdateFieldDto();
      fieldDto.name = 'C';

      const errors = await validate(fieldDto, { skipMissingProperties: true });
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should allow empty dto for partial update', async () => {
      const fieldDto = new UpdateFieldDto();

      const errors = await validate(fieldDto, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });
  });
});
