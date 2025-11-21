import { Type } from 'class-transformer';
import { GeoJSONPolygon } from '@/types';

export class TraceSalesOrderDetailDto {
  id: string;
  caliber: string;
  variety: string;
  unitPrice: number;
  quantityKg: number;
  quantityShipped: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TraceSalesOrderDetailDto>) {
    Object.assign(this, partial);
  }
}

export class TraceShipmentLotDetailDto {
  id: string;
  shipmentId: string;
  harvestLotId: string;
  salesOrderDetailId: string;
  quantityTakenKg: number;
  createdAt: Date;
  updatedAt: Date;

  @Type(() => TraceSalesOrderDetailDto)
  salesOrderDetail?: TraceSalesOrderDetailDto;

  constructor(partial: Partial<TraceShipmentLotDetailDto>) {
    Object.assign(this, partial);
  }
}

export class TraceShipmentDto {
  id: string;
  salesOrderId: string;
  shipmentDate: Date;
  trackingNumber?: string;
  notes?: string;
  updatedAt?: Date;

  constructor(partial: Partial<TraceShipmentDto>) {
    Object.assign(this, partial);
  }
}

export class TraceSalesOrderDto {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TraceSalesOrderDto>) {
    Object.assign(this, partial);
  }
}

export class TraceCustomerDto {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  contactEmail?: string;
  phoneNumber?: string;

  constructor(partial: Partial<TraceCustomerDto>) {
    Object.assign(this, partial);
  }
}

export class TraceCommercialDataDto {
  @Type(() => TraceShipmentDto)
  shipment?: TraceShipmentDto;

  @Type(() => TraceSalesOrderDto)
  salesOrder?: TraceSalesOrderDto;

  @Type(() => TraceCustomerDto)
  customer?: TraceCustomerDto;

  constructor(partial: Partial<TraceCommercialDataDto>) {
    Object.assign(this, partial);
  }
}

export class TraceHarvestLotDto {
  id: string;
  plotId: string;
  harvestDate: Date;
  lotCode: string;
  varietyName: string;
  grossWeightKg: number;
  netWeightKg?: number;
  remainingNetWeightKg?: number;
  yieldPercentage?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TraceHarvestLotDto>) {
    Object.assign(this, partial);
  }
}

export class TracePlotDto {
  id: string;
  name: string;
  area: number;
  fieldId: string;
  varietyId?: string;
  location: GeoJSONPolygon;

  constructor(partial: Partial<TracePlotDto>) {
    Object.assign(this, partial);
  }
}

export class TraceVarietyDto {
  id: string;
  name: string;
  description?: string;

  constructor(partial: Partial<TraceVarietyDto>) {
    Object.assign(this, partial);
  }
}

export class TraceAgriculturalDataDto {
  @Type(() => TraceHarvestLotDto)
  harvestLot?: TraceHarvestLotDto;

  @Type(() => TracePlotDto)
  plot?: TracePlotDto;

  @Type(() => TraceVarietyDto)
  variety?: TraceVarietyDto;

  constructor(partial: Partial<TraceAgriculturalDataDto>) {
    Object.assign(this, partial);
  }
}

export class TraceabilityResponseDto {
  @Type(() => TraceShipmentLotDetailDto)
  detail: TraceShipmentLotDetailDto;

  @Type(() => TraceCommercialDataDto)
  commercialData: TraceCommercialDataDto;

  @Type(() => TraceAgriculturalDataDto)
  agriculturalData: TraceAgriculturalDataDto;

  constructor(partial: Partial<TraceabilityResponseDto>) {
    Object.assign(this, partial);
  }
}
