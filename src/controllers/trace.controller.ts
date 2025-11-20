import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { instanceToPlain } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { TraceService } from '@services/trace.service';
import { HttpException } from '@/exceptions/HttpException';
import { isValidUUID } from '@/utils/validation.utils';

export class TraceController {
  private traceService: TraceService;

  constructor(private readonly dataSource: DataSource) {
    this.traceService = new TraceService(this.dataSource);
  }

  public getTraceability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shipmentLotDetailId } = req.params;

      if (!shipmentLotDetailId) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del detalle de envío es requerido');
      }

      if (!isValidUUID(shipmentLotDetailId)) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del detalle de envío no es un UUID válido');
      }

      const traceability = await this.traceService.getTraceability(shipmentLotDetailId);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(traceability),
        message: 'Trazabilidad obtenida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };
}
