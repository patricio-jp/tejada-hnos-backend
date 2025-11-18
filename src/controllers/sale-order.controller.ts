import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { instanceToPlain } from 'class-transformer';
import { DataSource } from 'typeorm';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';
import { CreateSalesOrderDto, UpdateSalesOrderDto, UpdateSalesOrderStatusDto } from '@dtos/sales-order.dto';
import { SalesOrderService } from '@services/sale-order.service';

export class SalesOrderController {
  private salesOrderService: SalesOrderService;

  constructor(private readonly dataSource: DataSource) {
    this.salesOrderService = new SalesOrderService(this.dataSource);
  }

  private transformSalesOrder(salesOrder: any) {
    const details = salesOrder.details?.map((detail: any) => {
      const quantityKg = Number(detail.quantityKg);
      const unitPrice = Number(detail.unitPrice);
      const quantityShipped = Number(detail.quantityShipped ?? 0);
      const quantityPending = quantityKg - quantityShipped;

      return {
        id: detail.id,
        salesOrderId: detail.salesOrderId,
        caliber: detail.caliber,
        variety: detail.variety,
        quantityKg,
        unitPrice,
        subtotal: quantityKg * unitPrice,
        quantityShipped,
        quantityPending,
        percentageShipped: quantityKg > 0 ? Math.min(100, Math.max(0, Math.round((quantityShipped / quantityKg) * 100))) : 0,
        status: detail.status,
      };
    }) || [];

    return {
      ...salesOrder,
      totalAmount: Number(salesOrder.totalAmount ?? 0),
      details,
    };
  }

  public getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const salesOrders = await this.salesOrderService.findAll();
      const transformed = salesOrders.map(order => this.transformSalesOrder(order));

      res.status(StatusCodes.OK).json({
        data: transformed,
        count: transformed.length,
        message: 'Órdenes de venta obtenidas exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const salesOrder = await this.salesOrderService.findById(id);
      const transformed = this.transformSalesOrder(salesOrder);

      res.status(StatusCodes.OK).json({
        data: transformed,
        message: 'Orden de venta obtenida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateSalesOrderDto = req.body;
      const salesOrder = await this.salesOrderService.create(data);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(salesOrder),
        message: 'Orden de venta creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const data: UpdateSalesOrderDto = req.body;
      const salesOrder = await this.salesOrderService.update(id, data);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(salesOrder),
        message: 'Orden de venta actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const data: UpdateSalesOrderStatusDto = req.body;

      if (!data?.status) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El estado es requerido para actualizar la orden de venta');
      }

      const salesOrder = await this.salesOrderService.updateStatus(id, data.status, data.details);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(salesOrder),
        message: `Estado de la orden de venta actualizado a ${data.status}`,
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const salesOrder = await this.salesOrderService.delete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(salesOrder),
        message: 'Orden de venta eliminada exitosamente',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const salesOrder = await this.salesOrderService.restore(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(salesOrder),
        message: 'Orden de venta restaurada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta es requerido');
      }

      if (!isValidUUID(id)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de venta no es un UUID válido');
      }

      const salesOrder = await this.salesOrderService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(salesOrder),
        message: 'Orden de venta eliminada permanentemente',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
