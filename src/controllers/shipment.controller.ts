import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '@/services/shipment.service';
import { CreateShipmentDto } from '@dtos/shipment.dto';
import { StatusCodes } from 'http-status-codes';
import { validate } from 'class-validator';
import { plainToClass, instanceToPlain } from 'class-transformer';
import { DataSource } from 'typeorm';

export class ShipmentController {
  private shipmentService: ShipmentService;

  constructor(dataSource: DataSource) {
    this.shipmentService = new ShipmentService(dataSource);
  }

  /**
   * POST /sales-orders/:salesOrderId/shipments
   * Crear un nuevo envío para una orden de venta
   */
  createShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { salesOrderId } = req.params;

      if (!salesOrderId) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'El ID de la orden de venta es requerido',
        });
        return;
      }

      const dto = plainToClass(CreateShipmentDto, req.body);

      // Validar DTO
      const errors = await validate(dto);
      if (errors.length > 0) {
        const messages = errors.map(err => Object.values(err.constraints || {}).join(', ')).join('; ');
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Errores de validación',
          errors: messages,
        });
        return;
      }

      // Crear el envío
      const shipment = await this.shipmentService.create(salesOrderId, dto);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(shipment),
        message: 'Envío creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /shipments
   * Obtener todos los envíos
   */
  getAllShipments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shipments = await this.shipmentService.findAll();

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(shipments),
        message: 'Envíos obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /shipments/:id
   * Obtener un envío por su ID
   */
  getShipmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'El ID del envío es requerido',
        });
        return;
      }

      const shipment = await this.shipmentService.findById(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(shipment),
        message: 'Envío obtenido exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /sales-orders/:salesOrderId/shipments
   * Obtener todos los envíos de una orden de venta
   */
  getShipmentsBySalesOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { salesOrderId } = req.params;

      if (!salesOrderId) {
        res.status(StatusCodes.BAD_REQUEST).json({
          message: 'El ID de la orden de venta es requerido',
        });
        return;
      }

      const shipments = await this.shipmentService.findBySalesOrder(salesOrderId);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(shipments),
        message: 'Envíos obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
