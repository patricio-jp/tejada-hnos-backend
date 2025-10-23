import { describe, it, expect } from '@jest/globals';
import { validate } from 'class-validator';
import { CreateActivityLogDto, UpdateActivityLogDto } from '../activity-log.dto';
import { ActivityType } from '../../enums';

describe('ActivityLogDTO', () => {
  describe('CreateActivityLogDto', () => {
    it('should validate correct activity', async () => {
      const activityLog = new CreateActivityLogDto();
      activityLog.activityType = ActivityType.PODA;
      activityLog.description = 'Se realizó la poda de los árboles en el lote 5';
      activityLog.executionDate = new Date('2024-06-15T10:00:00Z');
      activityLog.plotId = '550e8400-e29b-41d4-a716-446655440000';

      const errors = await validate(activityLog);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid activityType', async () => {
      const activityLog = new CreateActivityLogDto();
      activityLog.activityType = 'INVALID_ACTIVITY';
      activityLog.description = 'Se realizó la poda de los árboles en el lote 5';
      activityLog.executionDate = new Date('2024-06-15T10:00:00Z');
      activityLog.plotId = '550e8400-e29b-41d4-a716-446655440000';

      const errors = await validate(activityLog);
      expect(errors.length).toBeGreaterThan(0);
      const activityTypeError = errors.find(e => e.property === 'activityType');
      expect(activityTypeError).toBeDefined();
    });

    it('should reject missing activityType', async () => {
      const activityLog = new CreateActivityLogDto();
      activityLog.description = 'Se realizó la poda de los árboles en el lote 5';
      activityLog.executionDate = new Date('2024-06-15T10:00:00Z');
      activityLog.plotId = '550e8400-e29b-41d4-a716-446655440000';

      const errors = await validate(activityLog);
      expect(errors.length).toBeGreaterThan(0);
      const activityTypeError = errors.find(e => e.property === 'activityType');
      expect(activityTypeError).toBeDefined();
    });

    it('should reject invalid plotId', async () => {
      const activityLog = new CreateActivityLogDto();
      activityLog.activityType = ActivityType.PODA;
      activityLog.description = 'Se realizó la poda de los árboles en el lote 5';
      activityLog.executionDate = new Date('2024-06-15T10:00:00Z');
      activityLog.plotId = 'invalid-uuid';

      const errors = await validate(activityLog);
      expect(errors.length).toBeGreaterThan(0);
      const plotIdError = errors.find(e => e.property === 'plotId');
      expect(plotIdError).toBeDefined();
    });

    it('should reject invalid data', async () => {
      const activityLog = new CreateActivityLogDto();
      activityLog.activityType = ActivityType.RIEGO;
      activityLog.description = ''; // Empty description
      activityLog.executionDate = new Date('invalid-date'); // Invalid date
      activityLog.plotId = '550e8400-e29b-41d4-a716-446655440000';

      const errors = await validate(activityLog);
      expect(errors.length).toBeGreaterThan(0);
      const descriptionError = errors.find(e => e.property === 'description');
      const executionDateError = errors.find(e => e.property === 'executionDate');
      expect(descriptionError).toBeDefined();
      expect(executionDateError).toBeDefined();
    });
  });

  describe('UpdateActivityLogDto', () => {
    it('should validate partial update', async () => {
      const activityLog = new UpdateActivityLogDto();
      activityLog.description = 'Actualización de la descripción';

      const errors = await validate(activityLog, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });

    it('should allow empty dto for partial update', async () => {
      const activityLog = new UpdateActivityLogDto();

      const errors = await validate(activityLog, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });
  });
});
