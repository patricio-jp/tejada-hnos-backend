import { HarvestLotStatus, WalnutCaliber } from "@/enums";
import { IsEnum, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

/**
 * DTO para crear un lote de cosecha en estado PENDIENTE_PROCESO
 * Solo requiere peso bruto y datos básicos
 * varietyName, caliber y lotCode pueden dejarse null para asignar después
 */
export class CreateHarvestLotDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la parcela debe ser un UUID válido' })
  plotId?: string;

  @IsNotEmpty({ message: 'La fecha de cosecha es obligatoria' })
  @IsISO8601({}, { message: 'La fecha de cosecha debe ser una fecha válida' })
  harvestDate: Date;

  @IsOptional()
  @IsString({ message: 'El código de lote debe ser texto' })
  lotCode?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de la variedad debe ser texto' })
  varietyName?: string;

  @IsOptional()
  @IsEnum(WalnutCaliber, { message: 'El calibre no es válido' })
  caliber?: WalnutCaliber;

  @IsNotEmpty({ message: 'El peso bruto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso bruto debe ser un número válido' })
  @Min(0.01, { message: 'El peso bruto debe ser mayor a 0' })
  grossWeightKg: number;
}

/**
 * DTO para actualizar un lote en estado PENDIENTE_PROCESO
 * Solo permite modificar campos si el lote NO está EN_STOCK
 * Una vez EN_STOCK, el lote es inmutable (excepto remainingNetWeightKg y status via envíos)
 */
export class UpdateHarvestLotDto {
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de cosecha debe ser una fecha válida' })
  harvestDate?: Date;

  @IsOptional()
  @IsString({ message: 'El código de lote debe ser texto' })
  lotCode?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de la variedad debe ser texto' })
  varietyName?: string;

  @IsOptional()
  @IsEnum(WalnutCaliber, { message: 'El calibre no es válido' })
  caliber?: WalnutCaliber;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso bruto debe ser un número válido' })
  @Min(0.01, { message: 'El peso bruto debe ser mayor a 0' })
  grossWeightKg?: number;
}

/**
 * DTO para procesar/clasificar un lote (transición PENDIENTE_PROCESO → EN_STOCK)
 * Establece los campos finales y hace el lote inmutable
 */
export class ProcessHarvestLotDto {
  @IsOptional()
  @IsString({ message: 'El código de lote debe ser texto' })
  lotCode?: string;

  @IsNotEmpty({ message: 'El nombre de la variedad es obligatorio' })
  @IsString({ message: 'El nombre de la variedad debe ser texto' })
  varietyName: string;

  @IsNotEmpty({ message: 'El calibre es obligatorio' })
  @IsEnum(WalnutCaliber, { message: 'El calibre no es válido' })
  caliber: WalnutCaliber;

  @IsNotEmpty({ message: 'El peso neto es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso neto debe ser un número válido' })
  @Min(0.01, { message: 'El peso neto debe ser mayor a 0' })
  netWeightKg: number;
}
