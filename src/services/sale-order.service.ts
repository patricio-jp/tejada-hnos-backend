import { DataSource, Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { SalesOrder } from '@entities/sale-order.entity';
import { SalesOrderDetail } from '@entities/sale-order-detail.entity';
import { Customer } from '@entities/customer.entity';
import { HttpException } from '@/exceptions/HttpException';
import { CreateSalesOrderDto, SalesOrderDetailDto, UpdateSalesOrderDto } from '@dtos/sales-order.dto';
import { SalesOrderStatus, SalesOrderDetailStatus } from '@/enums';

interface UpdateSalesOrderDetailPayload extends SalesOrderDetailDto {
  id?: string;
}

interface UpdateSalesOrderDetailStatusPayload {
  detailId: string;
  status?: SalesOrderDetailStatus;
  quantityShipped?: number;
  unitPrice?: number;
}

export class SalesOrderService {
  private salesOrderRepository: Repository<SalesOrder>;

  constructor(private readonly dataSource: DataSource) {
    this.salesOrderRepository = this.dataSource.getRepository(SalesOrder);
  }

  public async create(data: CreateSalesOrderDto): Promise<SalesOrder> {
    return this.dataSource.transaction(async manager => {
      const customer = await manager.findOne(Customer, { where: { id: data.customerId } });

      if (!customer) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente no encontrado');
      }

      if (!data.details || data.details.length === 0) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Debe agregar al menos un detalle a la orden de venta');
      }

      let totalAmount = 0;

      for (const detail of data.details) {
        const quantity = Number(detail.quantityKg);
        const unitPrice = Number(detail.unitPrice);
        totalAmount += quantity * unitPrice;
      }

      const salesOrder = manager.create(SalesOrder, {
        customerId: data.customerId,
        status: data.status ?? SalesOrderStatus.APROBADA,
        totalAmount,
      });

      const savedSalesOrder = await manager.save(SalesOrder, salesOrder);

      for (const detail of data.details) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(SalesOrderDetail)
          .values({
            salesOrderId: savedSalesOrder.id,
            caliber: detail.caliber,
            variety: detail.variety,
            unitPrice: Number(detail.unitPrice),
            quantityKg: Number(detail.quantityKg),
            quantityShipped: detail.quantityShipped !== undefined ? Number(detail.quantityShipped) : 0,
            status: detail.status ?? SalesOrderDetailStatus.PENDIENTE,
          })
          .execute();
      }

      const result = await manager.findOne(SalesOrder, {
        where: { id: savedSalesOrder.id },
        relations: [
          'customer',
          'details',
          'shipments',
          'shipments.lotDetails',
          'shipments.lotDetails.harvestLot',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al crear la orden de venta');
      }

      return result;
    });
  }

  public async findAll(): Promise<SalesOrder[]> {
    return this.salesOrderRepository.find({
      relations: [
        'customer',
        'details',
        'shipments',
        'shipments.lotDetails',
        'shipments.lotDetails.harvestLot',
      ],
    });
  }

  public async findById(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id },
      relations: [
        'customer',
        'details',
        'shipments',
        'shipments.lotDetails',
        'shipments.lotDetails.harvestLot',
      ],
    });

    if (!salesOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
    }

    return salesOrder;
  }

  public async update(id: string, data: UpdateSalesOrderDto): Promise<SalesOrder> {
    return this.dataSource.transaction(async manager => {
      const salesOrder = await manager.findOne(SalesOrder, {
        where: { id },
        relations: ['details', 'customer'],
      });

      if (!salesOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
      }

      if (data.status && data.status !== salesOrder.status) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'Use el método updateStatus para cambiar el estado de la orden de venta');
      }

      if (data.customerId && data.customerId !== salesOrder.customerId) {
        const customer = await manager.findOne(Customer, { where: { id: data.customerId } });

        if (!customer) {
          throw new HttpException(StatusCodes.NOT_FOUND, 'Cliente no encontrado');
        }

        salesOrder.customerId = customer.id;
        salesOrder.customer = customer;
      }

      if (data.details && data.details.length > 0) {
        const detailsPayload = data.details as UpdateSalesOrderDetailPayload[];
        const detailsToUpdate = detailsPayload.filter((detail): detail is UpdateSalesOrderDetailPayload & { id: string } => Boolean(detail.id));
        const detailsToCreate = detailsPayload.filter(detail => !detail.id);
        const detailIdsToKeep = new Set(detailsToUpdate.map(detail => detail.id));

        for (const detailUpdate of detailsToUpdate) {
          const existingDetail = salesOrder.details.find(detail => detail.id === detailUpdate.id);

          if (!existingDetail) {
            throw new HttpException(
              StatusCodes.BAD_REQUEST,
              `El detalle con ID ${detailUpdate.id} no pertenece a esta orden de venta`
            );
          }

          const updateData: Partial<SalesOrderDetail> = {};

          if (detailUpdate.caliber !== undefined) {
            updateData.caliber = detailUpdate.caliber;
          }

          if (detailUpdate.variety !== undefined) {
            updateData.variety = detailUpdate.variety;
          }

          if (detailUpdate.unitPrice !== undefined) {
            updateData.unitPrice = Number(detailUpdate.unitPrice);
          }

          if (detailUpdate.quantityKg !== undefined) {
            updateData.quantityKg = Number(detailUpdate.quantityKg);
          }

          if (detailUpdate.quantityShipped !== undefined) {
            updateData.quantityShipped = Number(detailUpdate.quantityShipped);
          }

          if (detailUpdate.status !== undefined) {
            updateData.status = detailUpdate.status;
          }

          if (Object.keys(updateData).length > 0) {
            await manager
              .createQueryBuilder()
              .update(SalesOrderDetail)
              .set(updateData)
              .where('id = :id', { id: detailUpdate.id })
              .execute();
          }
        }

        for (const existingDetail of salesOrder.details) {
          if (!detailIdsToKeep.has(existingDetail.id)) {
            await manager.remove(SalesOrderDetail, existingDetail);
          }
        }

        for (const newDetail of detailsToCreate) {
          await manager
            .createQueryBuilder()
            .insert()
            .into(SalesOrderDetail)
            .values({
              salesOrderId: salesOrder.id,
              caliber: newDetail.caliber,
              variety: newDetail.variety,
              unitPrice: Number(newDetail.unitPrice),
              quantityKg: Number(newDetail.quantityKg),
              quantityShipped: newDetail.quantityShipped !== undefined ? Number(newDetail.quantityShipped) : 0,
              status: newDetail.status ?? SalesOrderDetailStatus.PENDIENTE,
            })
            .execute();
        }

        const updatedDetails = await manager.find(SalesOrderDetail, {
          where: { salesOrderId: salesOrder.id },
        });

        salesOrder.totalAmount = updatedDetails.reduce((acc, detail) => {
          return acc + Number(detail.quantityKg) * Number(detail.unitPrice);
        }, 0);
      }

      await manager
        .createQueryBuilder()
        .update(SalesOrder)
        .set({
          customerId: salesOrder.customerId,
          totalAmount: salesOrder.totalAmount,
        })
        .where('id = :id', { id: salesOrder.id })
        .execute();

      const result = await manager.findOne(SalesOrder, {
        where: { id: salesOrder.id },
        relations: [
          'customer',
          'details',
          'shipments',
          'shipments.lotDetails',
          'shipments.lotDetails.harvestLot',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al actualizar la orden de venta');
      }

      return result;
    });
  }

  public async updateStatus(
    id: string,
    status: SalesOrderStatus,
    details?: Array<UpdateSalesOrderDetailStatusPayload>
  ): Promise<SalesOrder> {
    return this.dataSource.transaction(async manager => {
      const salesOrder = await manager.findOne(SalesOrder, {
        where: { id },
        relations: ['details', 'customer'],
      });

      if (!salesOrder) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
      }

      if (details && details.length > 0) {
        const validDetailIds = salesOrder.details.map(detail => detail.id);
        const invalidIds = details
          .map(detail => detail.detailId)
          .filter(detailId => !validDetailIds.includes(detailId));

        if (invalidIds.length > 0) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            `Los siguientes IDs de detalle no pertenecen a esta orden de venta: ${invalidIds.join(', ')}`
          );
        }

        for (const detailUpdate of details) {
          const updateData: Partial<SalesOrderDetail> = {};

          if (detailUpdate.status !== undefined) {
            updateData.status = detailUpdate.status;
          }

          if (detailUpdate.quantityShipped !== undefined) {
            updateData.quantityShipped = Number(detailUpdate.quantityShipped);
          }

          if (detailUpdate.unitPrice !== undefined) {
            updateData.unitPrice = Number(detailUpdate.unitPrice);
          }

          if (Object.keys(updateData).length > 0) {
            await manager
              .createQueryBuilder()
              .update(SalesOrderDetail)
              .set(updateData)
              .where('id = :id', { id: detailUpdate.detailId })
              .execute();
          }
        }
      }

      if (details && details.length > 0) {
        const updatedDetails = await manager.find(SalesOrderDetail, {
          where: { salesOrderId: salesOrder.id },
        });

        salesOrder.totalAmount = updatedDetails.reduce((acc, detail) => {
          return acc + Number(detail.quantityKg) * Number(detail.unitPrice);
        }, 0);
      }

      await manager
        .createQueryBuilder()
        .update(SalesOrder)
        .set({ status, totalAmount: salesOrder.totalAmount })
        .where('id = :id', { id: salesOrder.id })
        .execute();

      const result = await manager.findOne(SalesOrder, {
        where: { id: salesOrder.id },
        relations: [
          'customer',
          'details',
          'shipments',
          'shipments.lotDetails',
          'shipments.lotDetails.harvestLot',
        ],
      });

      if (!result) {
        throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Error al actualizar el estado de la orden de venta');
      }

      return result;
    });
  }

  public async delete(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderRepository.findOne({ where: { id } });

    if (!salesOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
    }

    return this.salesOrderRepository.softRemove(salesOrder);
  }

  public async restore(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!salesOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
    }

    return this.salesOrderRepository.recover(salesOrder);
  }

  public async hardDelete(id: string): Promise<SalesOrder> {
    const salesOrder = await this.salesOrderRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!salesOrder) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'Orden de venta no encontrada');
    }

    return this.salesOrderRepository.remove(salesOrder);
  }
}
