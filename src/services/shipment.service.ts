import { DataSource, Repository } from 'typeorm';
import { Shipment } from '@entities/shipment.entity';
import { ShipmentLotDetail } from '@entities/shipment-lot-detail.entity';
import { SalesOrder } from '@entities/sale-order.entity';
import { SalesOrderDetail } from '@entities/sale-order-detail.entity';
import { HarvestLot } from '@entities/harvest-lot.entity';
import { CreateShipmentDto } from '@dtos/shipment.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { SalesOrderStatus, SalesOrderDetailStatus, HarvestLotStatus } from '@/enums';

export class ShipmentService {
  private shipmentRepository: Repository<Shipment>;
  private salesOrderRepository: Repository<SalesOrder>;

  constructor(private dataSource: DataSource) {
    this.shipmentRepository = this.dataSource.getRepository(Shipment);
    this.salesOrderRepository = this.dataSource.getRepository(SalesOrder);
  }

  /**
   * Crear un nuevo envío y actualizar todos los inventarios y estados
   * @param salesOrderId ID de la orden de venta
   * @param data Datos del envío
   * @returns Promise<Shipment> El envío creado con todas sus relaciones
   */
  public async create(salesOrderId: string, data: CreateShipmentDto): Promise<Shipment> {
    // Validaciones previas fuera de la transacción
    if (!data.lotDetails || data.lotDetails.length === 0) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'Debe incluir al menos un detalle de lote en el envío'
      );
    }

    // Validar que todos los detalles tengan los campos requeridos
    for (const detail of data.lotDetails) {
      if (!detail.harvestLotId || !detail.salesOrderDetailId || !detail.quantityTakenKg) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'Todos los detalles deben tener harvestLotId, salesOrderDetailId y quantityTakenKg válidos'
        );
      }

      if (detail.quantityTakenKg <= 0) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'La cantidad a enviar debe ser mayor a 0'
        );
      }
    }

    return await this.dataSource.transaction(async (manager) => {
      // 1. Validar que la orden de venta existe y está en estado válido
      const salesOrder = await manager.findOne(SalesOrder, {
        where: { id: salesOrderId },
        relations: ['details', 'customer'],
      });

      if (!salesOrder) {
        throw new HttpException(
          StatusCodes.NOT_FOUND,
          'Orden de venta no encontrada'
        );
      }

      // Validar que la orden esté APROBADA o DESPACHADA_PARCIAL
      if (
        salesOrder.status !== SalesOrderStatus.APROBADA &&
        salesOrder.status !== SalesOrderStatus.DESPACHADA_PARCIAL
      ) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          `No se puede crear envío para una orden en estado ${salesOrder.status}. ` +
          `La orden debe estar APROBADA o DESPACHADA_PARCIAL.`
        );
      }

      // 2. Validar que todos los salesOrderDetailId pertenecen a esta orden
      const salesOrderDetailIds = salesOrder.details.map(d => d.id);
      const invalidDetails = data.lotDetails.filter(
        detail => !salesOrderDetailIds.includes(detail.salesOrderDetailId)
      );

      if (invalidDetails.length > 0) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          'Uno o más detalles no pertenecen a esta orden de venta'
        );
      }

      // 3. Crear la cabecera del envío
      const shipmentData: any = {
        salesOrderId: salesOrder.id,
      };

      if (data.trackingNumber) {
        shipmentData.trackingNumber = data.trackingNumber;
      }

      if (data.notes) {
        shipmentData.notes = data.notes;
      }

      const shipment = manager.create(Shipment, shipmentData);
      const savedShipment = await manager.save(Shipment, shipment);

      // 4. Procesar cada detalle de lote
      for (const lotDetailDto of data.lotDetails) {
        // 4.1. Cargar el HarvestLot con validaciones
        const harvestLot = await manager.findOne(HarvestLot, {
          where: { id: lotDetailDto.harvestLotId },
        });

        if (!harvestLot) {
          throw new HttpException(
            StatusCodes.NOT_FOUND,
            `Lote de cosecha ${lotDetailDto.harvestLotId} no encontrado`
          );
        }

        // Validar que el lote esté EN_STOCK (procesado)
        if (harvestLot.status !== HarvestLotStatus.EN_STOCK) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `El lote ${harvestLot.lotCode || harvestLot.id} no está disponible para envío. ` +
            `Estado actual: ${harvestLot.status}. Debe estar EN_STOCK (procesado y clasificado).`
          );
        }

        // Validar que el lote tenga clasificación completa (varietyName, caliber, netWeightKg)
        if (!harvestLot.varietyName || !harvestLot.caliber) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `El lote ${harvestLot.lotCode || harvestLot.id} no tiene clasificación completa. ` +
            `Debe procesarse con variedad y calibre antes de enviarlo.`
          );
        }

        // Validar que el lote tenga peso neto y remainingNetWeightKg definidos
        if (!harvestLot.netWeightKg || harvestLot.remainingNetWeightKg === null || harvestLot.remainingNetWeightKg === undefined) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `El lote ${harvestLot.lotCode || harvestLot.id} no tiene peso neto definido. ` +
            `Debe procesarse antes de enviarlo.`
          );
        }

        // Validar stock disponible
        const remainingStock = Number(harvestLot.remainingNetWeightKg);
        const quantityRequested = Number(lotDetailDto.quantityTakenKg);

        if (quantityRequested > remainingStock) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `Stock insuficiente en Lote ${harvestLot.lotCode || harvestLot.id}. ` +
            `Disponible: ${remainingStock.toFixed(2)} kg, Solicitado: ${quantityRequested.toFixed(2)} kg`
          );
        }

        // 4.2. Cargar el SalesOrderDetail con validaciones
        const salesOrderDetail = await manager.findOne(SalesOrderDetail, {
          where: { id: lotDetailDto.salesOrderDetailId },
        });

        if (!salesOrderDetail) {
          throw new HttpException(
            StatusCodes.NOT_FOUND,
            `Detalle de orden de venta ${lotDetailDto.salesOrderDetailId} no encontrado`
          );
        }

        // Validar que el lote coincida con el detalle del pedido (variedad y calibre)
        // NOTA: varietyName y caliber están garantizados como no-null por la validación anterior
        if (harvestLot.varietyName!.toLowerCase() !== salesOrderDetail.variety.toLowerCase()) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `El lote ${harvestLot.lotCode || harvestLot.id} es de variedad "${harvestLot.varietyName}", ` +
            `pero el pedido requiere "${salesOrderDetail.variety}"`
          );
        }

        if (harvestLot.caliber !== salesOrderDetail.caliber) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `El lote ${harvestLot.lotCode || harvestLot.id} es de calibre "${harvestLot.caliber}", ` +
            `pero el pedido requiere "${salesOrderDetail.caliber}"`
          );
        }

        // Validar que no se exceda la cantidad pendiente de enviar
        const orderedQuantity = Number(salesOrderDetail.quantityKg);
        const alreadyShipped = Number(salesOrderDetail.quantityShipped);
        const pendingQuantity = orderedQuantity - alreadyShipped;

        if (quantityRequested > pendingQuantity) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `No se puede enviar ${quantityRequested.toFixed(2)} kg. ` +
            `Cantidad pendiente del pedido: ${pendingQuantity.toFixed(2)} kg`
          );
        }

        // 4.3. Crear el detalle del envío
        const shipmentLotDetail = manager.create(ShipmentLotDetail, {
          shipmentId: savedShipment.id,
          harvestLotId: harvestLot.id,
          salesOrderDetailId: salesOrderDetail.id,
          quantityTakenKg: quantityRequested,
        });

        await manager.save(ShipmentLotDetail, shipmentLotDetail);

        // 4.4. Actualizar inventario del lote de cosecha
        harvestLot.remainingNetWeightKg = Number((remainingStock - quantityRequested).toFixed(2));

        // Si el lote se agotó, cambiar su estado a VENDIDO
        if (harvestLot.remainingNetWeightKg <= 0) {
          harvestLot.status = HarvestLotStatus.VENDIDO;
        }

        await manager.save(HarvestLot, harvestLot);

        // 4.5. Actualizar cantidad enviada en el detalle del pedido
        salesOrderDetail.quantityShipped = Number((alreadyShipped + quantityRequested).toFixed(2));

        // Calcular pendiente y actualizar estado del detalle
        const newPendingQuantity = orderedQuantity - salesOrderDetail.quantityShipped;

        if (newPendingQuantity <= 0) {
          salesOrderDetail.status = SalesOrderDetailStatus.COMPLETA;
        } else {
          salesOrderDetail.status = SalesOrderDetailStatus.DESPACHADA_PARCIAL;
        }

        await manager.save(SalesOrderDetail, salesOrderDetail);
      }

      // 5. Actualizar estado de la orden de venta (cabecera)
      // Recargar los detalles actualizados
      const updatedDetails = await manager.find(SalesOrderDetail, {
        where: { salesOrderId: salesOrder.id },
      });

      // Verificar si todas las líneas están COMPLETA
      const allComplete = updatedDetails.every(
        detail => detail.status === SalesOrderDetailStatus.COMPLETA
      );

      // Verificar si alguna línea está DESPACHADA_PARCIAL o COMPLETA
      const hasPartialOrComplete = updatedDetails.some(
        detail =>
          detail.status === SalesOrderDetailStatus.DESPACHADA_PARCIAL ||
          detail.status === SalesOrderDetailStatus.COMPLETA
      );

      if (allComplete) {
        salesOrder.status = SalesOrderStatus.DESPACHADA_TOTAL;
      } else if (hasPartialOrComplete) {
        salesOrder.status = SalesOrderStatus.DESPACHADA_PARCIAL;
      }

      await manager.save(SalesOrder, salesOrder);

      // 6. Retornar el envío con todas sus relaciones
      const createdShipment = await manager.findOne(Shipment, {
        where: { id: savedShipment.id },
        relations: [
          'salesOrder',
          'salesOrder.customer',
          'lotDetails',
          'lotDetails.harvestLot',
          'lotDetails.harvestLot.plot',
          'lotDetails.salesOrderDetail',
        ],
      });

      if (!createdShipment) {
        throw new HttpException(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Error al recuperar el envío creado'
        );
      }

      return createdShipment;
    });
  }

  /**
   * Obtener todos los envíos
   * @returns Promise<Shipment[]>
   */
  public async findAll(): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      relations: [
        'salesOrder',
        'salesOrder.customer',
        'lotDetails',
        'lotDetails.harvestLot',
        'lotDetails.salesOrderDetail',
      ],
      order: { shipmentDate: 'DESC' },
    });
  }

  /**
   * Obtener un envío por su ID
   * @param id ID del envío
   * @returns Promise<Shipment>
   */
  public async findById(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: [
        'salesOrder',
        'salesOrder.customer',
        'salesOrder.details',
        'lotDetails',
        'lotDetails.harvestLot',
        'lotDetails.harvestLot.plot',
        'lotDetails.salesOrderDetail',
      ],
    });

    if (!shipment) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'Envío no encontrado'
      );
    }

    return shipment;
  }

  /**
   * Obtener todos los envíos de una orden de venta
   * @param salesOrderId ID de la orden de venta
   * @returns Promise<Shipment[]>
   */
  public async findBySalesOrder(salesOrderId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: { salesOrderId },
      relations: [
        'salesOrder',
        'salesOrder.customer',
        'lotDetails',
        'lotDetails.harvestLot',
        'lotDetails.harvestLot.plot',
        'lotDetails.salesOrderDetail',
      ],
      order: { shipmentDate: 'DESC' },
    });
  }
}
