import { IsNotEmpty, IsNumber, IsUUID, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from './location.dto';

export class CreatePlotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  area: number;

  @IsString()
  @IsOptional()
  variety?: string;

  fieldId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

export class UpdatePlotDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  variety?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}
