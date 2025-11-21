import { DataSource, Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ShipmentLotDetail } from '@entities/shipment-lot-detail.entity';
import { HarvestLot } from '@entities/harvest-lot.entity';
import { Shipment } from '@entities/shipment.entity';
import { SalesOrder } from '@entities/sale-order.entity';
import { Customer } from '@entities/customer.entity';
import { Plot } from '@entities/plot.entity';
import { Variety } from '@entities/variety.entity';
import { SalesOrderDetail } from '@entities/sale-order-detail.entity';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';
import {
  TraceabilityResponseDto,
  TraceAgriculturalDataDto,
  TraceCommercialDataDto,
  TraceCustomerDto,
  TraceHarvestLotDto,
  TracePlotDto,
  TraceSalesOrderDetailDto,
  TraceSalesOrderDto,
  TraceShipmentDto,
  TraceShipmentLotDetailDto,
  TraceVarietyDto,
} from '@dtos/traceability-response.dto';

export class TraceService {
  private shipmentLotDetailRepository: Repository<ShipmentLotDetail>;
  private harvestLotRepository: Repository<HarvestLot>;
  private shipmentRepository: Repository<Shipment>;
  private salesOrderRepository: Repository<SalesOrder>;
  private customerRepository: Repository<Customer>;
  private plotRepository: Repository<Plot>;
  private varietyRepository: Repository<Variety>;
  private salesOrderDetailRepository: Repository<SalesOrderDetail>;

  constructor(private readonly dataSource: DataSource) {
    this.shipmentLotDetailRepository = dataSource.getRepository(ShipmentLotDetail);
    this.harvestLotRepository = dataSource.getRepository(HarvestLot);
    this.shipmentRepository = dataSource.getRepository(Shipment);
    this.salesOrderRepository = dataSource.getRepository(SalesOrder);
    this.customerRepository = dataSource.getRepository(Customer);
    this.plotRepository = dataSource.getRepository(Plot);
    this.varietyRepository = dataSource.getRepository(Variety);
    this.salesOrderDetailRepository = dataSource.getRepository(SalesOrderDetail);
  }

  public async getTraceability(shipmentLotDetailId: string): Promise<TraceabilityResponseDto> {
    if (!shipmentLotDetailId || !isValidUUID(shipmentLotDetailId)) {
      throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del detalle de envío no es válido');
    }

    const shipmentLotDetail = await this.shipmentLotDetailRepository.findOne({
      where: { id: shipmentLotDetailId },
    });

    if (!shipmentLotDetail) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Detalle de envío no encontrado');
    }

    const { shipmentId, harvestLotId, salesOrderDetailId } = shipmentLotDetail;

    const [harvestLot, shipment, salesOrderDetail] = await Promise.all([
      harvestLotId
        ? this.harvestLotRepository.findOne({
            where: { id: harvestLotId },
          })
        : Promise.resolve(null),
      shipmentId
        ? this.shipmentRepository.findOne({
            where: { id: shipmentId },
            relations: ['salesOrder'],
          })
        : Promise.resolve(null),
      salesOrderDetailId
        ? this.salesOrderDetailRepository.findOne({ where: { id: salesOrderDetailId } })
        : Promise.resolve(null),
    ]);

    if (shipmentId && !shipment) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Envío asociado no encontrado');
    }

    if (harvestLotId && !harvestLot) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Lote de cosecha asociado no encontrado');
    }

    if (salesOrderDetailId && !salesOrderDetail) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Detalle de orden de venta asociado no encontrado');
    }

    let plot: Plot | null = null;
    let variety: Variety | null = null;

    if (harvestLot) {
      plot = harvestLot.plotId
        ? await this.plotRepository.findOne({ where: { id: harvestLot.plotId } })
        : null;

      if (plot && plot.varietyId) {
        variety = await this.varietyRepository.findOne({ where: { id: plot.varietyId } });
      }
    }

    let salesOrder: SalesOrder | null = shipment?.salesOrder ?? null;

    if (!salesOrder && salesOrderDetail?.salesOrderId) {
      salesOrder = await this.salesOrderRepository.findOne({ where: { id: salesOrderDetail.salesOrderId } });
    }

    if (!salesOrder && shipment?.salesOrderId) {
      salesOrder = await this.salesOrderRepository.findOne({ where: { id: shipment.salesOrderId } });
    }

    if (!salesOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta asociada no encontrada');
    }

    const customer = await this.customerRepository.findOne({ where: { id: salesOrder.customerId } });

    if (!customer) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente asociado no encontrado');
    }

    const detailDto = new TraceShipmentLotDetailDto({
      id: shipmentLotDetail.id,
      shipmentId: shipmentLotDetail.shipmentId,
      harvestLotId: shipmentLotDetail.harvestLotId,
      salesOrderDetailId: shipmentLotDetail.salesOrderDetailId,
      quantityTakenKg: Number(shipmentLotDetail.quantityTakenKg),
      createdAt: shipmentLotDetail.createdAt,
      updatedAt: shipmentLotDetail.updatedAt,
    });

    if (salesOrderDetail) {
      detailDto.salesOrderDetail = new TraceSalesOrderDetailDto({
        id: salesOrderDetail.id,
        caliber: salesOrderDetail.caliber,
        variety: salesOrderDetail.variety,
        unitPrice: Number(salesOrderDetail.unitPrice),
        quantityKg: Number(salesOrderDetail.quantityKg),
        quantityShipped: Number(salesOrderDetail.quantityShipped),
        status: salesOrderDetail.status,
        createdAt: salesOrderDetail.createdAt,
        updatedAt: salesOrderDetail.updatedAt,
      });
    }

    const commercialData = new TraceCommercialDataDto({});

    if (shipment) {
      commercialData.shipment = new TraceShipmentDto({
        id: shipment.id,
        salesOrderId: shipment.salesOrderId,
        shipmentDate: shipment.shipmentDate,
        trackingNumber: shipment.trackingNumber ?? undefined,
        notes: shipment.notes ?? undefined,
        updatedAt: shipment.updatedAt,
      });
    }

    commercialData.salesOrder = new TraceSalesOrderDto({
      id: salesOrder.id,
      status: salesOrder.status,
      totalAmount: Number(salesOrder.totalAmount),
      createdAt: salesOrder.createdAt,
      updatedAt: salesOrder.updatedAt,
    });

    commercialData.customer = new TraceCustomerDto({
      id: customer.id,
      name: customer.name,
      taxId: customer.taxId ?? undefined,
      address: customer.address ?? undefined,
      contactEmail: customer.contactEmail ?? undefined,
      phoneNumber: customer.phoneNumber ?? undefined,
    });

    const agriculturalData = new TraceAgriculturalDataDto({});

    if (harvestLot) {
      const harvestLotDto = new TraceHarvestLotDto({
        id: harvestLot.id,
        plotId: harvestLot.plotId,
        harvestDate: harvestLot.harvestDate,
        lotCode: harvestLot.lotCode,
        varietyName: harvestLot.varietyName,
        grossWeightKg: Number(harvestLot.grossWeightKg),
        status: harvestLot.status,
        createdAt: harvestLot.createdAt,
        updatedAt: harvestLot.updatedAt,
      });

      if (harvestLot.netWeightKg !== null && harvestLot.netWeightKg !== undefined) {
        harvestLotDto.netWeightKg = Number(harvestLot.netWeightKg);
      }

      if (harvestLot.remainingNetWeightKg !== null && harvestLot.remainingNetWeightKg !== undefined) {
        harvestLotDto.remainingNetWeightKg = Number(harvestLot.remainingNetWeightKg);
      }

      if (harvestLot.yieldPercentage !== null && harvestLot.yieldPercentage !== undefined) {
        harvestLotDto.yieldPercentage = Number(harvestLot.yieldPercentage);
      }

      agriculturalData.harvestLot = harvestLotDto;
    }

    if (plot) {
      agriculturalData.plot = new TracePlotDto({
        id: plot.id,
        name: plot.name,
        area: Number(plot.area),
        fieldId: plot.fieldId,
        varietyId: plot.varietyId ?? undefined,
        location: plot.location,
      });
    }

    if (variety) {
      agriculturalData.variety = new TraceVarietyDto({
        id: variety.id,
        name: variety.name,
        description: variety.description ?? undefined,
      });
    }

    return new TraceabilityResponseDto({
      detail: detailDto,
      commercialData,
      agriculturalData,
    });
  }
}
