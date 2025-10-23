import { describe, it } from "@jest/globals";
import { validate } from "class-validator";
import { CreatePlotDto, UpdatePlotDto } from '../plot.dto';

describe('PlotDTO', () => {
  describe('CreatePlotDto', () => {
    it('should validate correct plot data', async () => {
      const plotDto = new CreatePlotDto();
      plotDto.name = 'Lote 1';
      plotDto.area = 1500;
      plotDto.variety = 'Manzanas';
      plotDto.fieldId = '550e8400-e29b-41d4-a716-446655440000';
      plotDto.location = {
        type: 'Polygon',
        coordinates: [[[ -70.0, -30.0 ], [ -70.1, -30.0 ], [ -70.1, -30.1 ], [ -70.0, -30.1 ], [ -70.0, -30.0 ]]]
      };

      const errors = await validate(plotDto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing required fields', async () => {
      const plotDto = new CreatePlotDto();
      plotDto.area = 1500;

      const errors = await validate(plotDto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(e => e.property === 'name');
      const fieldIdError = errors.find(e => e.property === 'fieldId');
      const locationError = errors.find(e => e.property === 'location');
      expect(nameError).toBeDefined();
      expect(fieldIdError).toBeDefined();
      expect(locationError).toBeDefined();
    });

    it('should reject invalid area type', async () => {
      const plotDto = new CreatePlotDto();
      plotDto.name = 'Lote 1';
      // @ts-ignore
      plotDto.area = 'mil quinientos'; // Invalid type
      plotDto.fieldId = '550e8400-e29b-41d4-a716-446655440000';
      plotDto.location = {
        type: 'Polygon',
        coordinates: [[[ -70.0, -30.0 ], [ -70.1, -30.0 ], [ -70.1, -30.1 ], [ -70.0, -30.1 ], [ -70.0, -30.0 ]]]
      };

      const errors = await validate(plotDto);
      expect(errors.length).toBeGreaterThan(0);
      const areaError = errors.find(e => e.property === 'area');
      expect(areaError).toBeDefined();
    });

    it('should reject invalid location format', async () => {
      const plotDto = new CreatePlotDto();
      plotDto.name = 'Lote 1';
      plotDto.area = 1500;
      plotDto.fieldId = '550e8400-e29b-41d4-a716-446655440000';
      plotDto.location = {
        type: 'Polygon',
        coordinates: [ -70.0 ]
      };

      const errors = await validate(plotDto);
      expect(errors.length).toBeGreaterThan(0);
      const locationError = errors.find(e => e.property === 'location');
      expect(locationError).toBeDefined();
    });
  });

  describe('UpdatePlotDto', () => {
    it('should validate partial update with valid data', async () => {
      const plotDto = new UpdatePlotDto();
      plotDto.name = 'Lote 1 Actualizado';
      plotDto.area = 1600;

      const errors = await validate(plotDto, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });

    it('should reject invalid location format', async () => {
      const plotDto = new UpdatePlotDto();
      plotDto.location = {
        type: 'Polygon',
        coordinates: [ -70.0 ]
      };

      const errors = await validate(plotDto, { skipMissingProperties: true });
      expect(errors.length).toBeGreaterThan(0);
      const locationError = errors.find(e => e.property === 'location');
      expect(locationError).toBeDefined();
    });

    it('should allow empty dto for partial update', async () => {
      const plotDto = new UpdatePlotDto();

      const errors = await validate(plotDto, { skipMissingProperties: true });
      expect(errors.length).toBe(0);
    });
  });
});
