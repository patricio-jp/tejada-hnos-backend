import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { PlotService } from '@services/plot.service';
import { PlotFilters } from '@/interfaces/filters.interface';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@/enums';
import { instanceToPlain } from 'class-transformer';

export class PlotController {
  private plotService: PlotService;

  constructor(dataSource: DataSource) {
    this.plotService = new PlotService(dataSource);
  }

  /**
   * GET /plots
   * Obtener todas las parcelas (adaptativo según contexto)
   */
  public getPlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: PlotFilters = {};

      if (req.query.fieldId) {
        filters.fieldId = req.query.fieldId as string;
      }

      if (req.query.varietyId) {
        filters.varietyId = req.query.varietyId as string;
      }

      if (req.query.minArea) {
        filters.minArea = parseFloat(req.query.minArea as string);
      }

      if (req.query.maxArea) {
        filters.maxArea = parseFloat(req.query.maxArea as string);
      }

      // <--- AGREGADO: Soporte para ver eliminados (parche con as any)
      if (req.query.withDeleted === 'true') {
        // Usamos as any por si la interfaz PlotFilters no tiene la propiedad tipada aun
        (filters as any).withDeleted = true;
      }

      // Agregar managedFieldIds desde el middleware de autorización (para CAPATAZ)
      if (req.requiredManagedFieldIds && req.requiredManagedFieldIds.length > 0) {
        filters.managedFieldIds = req.requiredManagedFieldIds;
      }

      // Determinar si debe incluir detalles completos
      const hasFilters = Object.keys(req.query).length > 0;
      const includeFullDetails = hasFilters || req.user?.role === UserRole.ADMIN;

      const result = await this.plotService.getAllPlots({
        filters,
        includeFullDetails,
        ...(req.user?.userId && { userId: req.user.userId }),
        ...(req.user?.role && { userRole: req.user.role }),
      });

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(result.data),
        count: result.count,
        message: 'Parcelas obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  // -------------------------------------------------------------------------
  // OTROS MÉTODOS (Sin cambios)
  // -------------------------------------------------------------------------
  
  public getPlotById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      const plot = await this.plotService.getPlotById(id);
      res.status(StatusCodes.OK).json({ data: instanceToPlain(plot), message: 'Parcela obtenida exitosamente.' });
    } catch (error) { next(error); }
  };

  public createPlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plotData: CreatePlotDto = req.body;
      const newPlot = await this.plotService.createPlot(plotData);
      res.status(StatusCodes.CREATED).json({ data: instanceToPlain(newPlot), message: 'Parcela creada exitosamente.' });
    } catch (error) { next(error); }
  };

  public updatePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const plotData: UpdatePlotDto = req.body;
      if (!id) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      const updatedPlot = await this.plotService.updatePlot(id, plotData);
      res.status(StatusCodes.OK).json({ data: instanceToPlain(updatedPlot), message: 'Parcela actualizada exitosamente.' });
    } catch (error) { next(error); }
  };

  public deletePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      const deletedPlot = await this.plotService.deletePlot(id);
      res.status(StatusCodes.OK).json({ data: instanceToPlain(deletedPlot), message: 'Parcela eliminada exitosamente.', canRestore: true });
    } catch (error) { next(error); }
  };

  public restorePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      const restoredPlot = await this.plotService.restorePlot(id);
      res.status(StatusCodes.OK).json({ data: instanceToPlain(restoredPlot), message: 'Parcela restaurada exitosamente.' });
    } catch (error) { next(error); }
  };

  public hardDeletePlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la parcela es requerido.');
      const deletedPlot = await this.plotService.hardDeletePlot(id);
      res.status(StatusCodes.OK).json({ data: instanceToPlain(deletedPlot), message: 'Parcela eliminada permanentemente.', canRestore: false });
    } catch (error) { next(error); }
  };
}
