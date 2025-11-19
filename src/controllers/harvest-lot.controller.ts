import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { HarvestLotService, HarvestLotFilters } from '@services/harvest-lot.service';
import { CreateHarvestLotDto, UpdateHarvestLotDto, ProcessHarvestLotDto } from '@dtos/harvest-lot.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { HarvestLotStatus } from '@/enums';
import { instanceToPlain } from 'class-transformer';

export class HarvestLotController {
  private harvestLotService: HarvestLotService;

  constructor(dataSource: DataSource) {
    this.harvestLotService = new HarvestLotService(dataSource);
  }

  /**
   * POST /harvest-lots
   * Crear un nuevo lote de cosecha (registro de peso bruto)
   */
  public createHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const createHarvestLotDto: CreateHarvestLotDto = req.body;

      const harvestLot = await this.harvestLotService.create(createHarvestLotDto);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(harvestLot),
        message: 'Lote de cosecha creado exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /harvest-lots
   * Obtener todos los lotes de cosecha con filtros opcionales
   */
  public getHarvestLots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: HarvestLotFilters = {};

      if (req.query.plotId) {
        filters.plotId = req.query.plotId as string;
      }

      if (req.query.status) {
        filters.status = req.query.status as HarvestLotStatus;
      }

      if (req.query.varietyName) {
        filters.varietyName = req.query.varietyName as string;
      }

      if (req.query.minGrossWeight) {
        filters.minGrossWeight = parseFloat(req.query.minGrossWeight as string);
      }

      if (req.query.maxGrossWeight) {
        filters.maxGrossWeight = parseFloat(req.query.maxGrossWeight as string);
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const harvestLots = await this.harvestLotService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLots),
        count: harvestLots.length,
        message: 'Lotes de cosecha obtenidos exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /harvest-lots/:id
   * Obtener un lote de cosecha por su ID
   */
  public getHarvestLotById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const harvestLot = await this.harvestLotService.findById(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLot),
        message: 'Lote de cosecha obtenido exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /harvest-lots/:id
   * Actualizar un lote de cosecha en estado PENDIENTE_PROCESO
   */
  public updateHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updateHarvestLotDto: UpdateHarvestLotDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const harvestLot = await this.harvestLotService.update(id, updateHarvestLotDto);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLot),
        message: 'Lote de cosecha actualizado exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /harvest-lots/:id/process
   * Procesar/clasificar un lote (PENDIENTE_PROCESO → EN_STOCK)
   * Establece varietyName, caliber, netWeightKg y hace el lote inmutable
   */
  public processHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const processHarvestLotDto: ProcessHarvestLotDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const harvestLot = await this.harvestLotService.process(id, processHarvestLotDto);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLot),
        message: 'Lote de cosecha procesado y clasificado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /harvest-lots/:id
   * Eliminar un lote de cosecha (soft delete)
   */
  public deleteHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const deletedHarvestLot = await this.harvestLotService.delete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedHarvestLot),
        message: 'Lote de cosecha eliminado exitosamente.',
        canRestore: true
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /harvest-lots/:id/restore
   * Restaurar un lote de cosecha eliminado
   */
  public restoreHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const harvestLot = await this.harvestLotService.restore(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLot),
        message: 'Lote de cosecha restaurado exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /plots/:id/harvest-lots
   * Obtener lotes de cosecha por parcela
   */
  public getHarvestLotsByPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: plotId } = req.params;

      if (!plotId) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es obligatorio.');
      }

      const harvestLots = await this.harvestLotService.findAll({ plotId });

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(harvestLots),
        count: harvestLots.length,
        message: 'Lotes de cosecha obtenidos exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /harvest-lots/:id/permanent
   * Eliminar permanentemente un lote de cosecha (hard delete)
   */
  public hardDeleteHarvestLot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del lote es obligatorio.');
      }

      const deletedHarvestLot = await this.harvestLotService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedHarvestLot),
        message: 'Lote de cosecha eliminado permanentemente.',
        canRestore: false
      });
    } catch (error) {
      next(error);
    }
  };
}
