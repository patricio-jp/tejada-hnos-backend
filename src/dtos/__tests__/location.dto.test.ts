import { describe, it } from "@jest/globals";
import { validate } from "class-validator";
import { LocationDto } from "../location.dto";

describe('LocationDTO', () => {
  it('should validate correct location data', async () => {
    const locationDto = new LocationDto();
    locationDto.type = 'Polygon';
    locationDto.coordinates = [[ -70.0, -30.0 ], [ -70.1, -30.0 ], [ -70.1, -30.1 ], [ -70.0, -30.1 ], [ -70.0, -30.0 ]];

    const errors = await validate(locationDto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid location data', async () => {
    const locationDto = new LocationDto();
    locationDto.type = 'Polygon';
    locationDto.coordinates = [ -70.0, -30.0 ];

    const errors = await validate(locationDto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject missing required fields', async () => {
    const locationDto = new LocationDto();

    const errors = await validate(locationDto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
