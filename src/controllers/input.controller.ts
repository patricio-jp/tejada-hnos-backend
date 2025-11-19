import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { InputService } from '@services/input.service';
import { CreateInputDto, UpdateInputDto } from '@dtos/input.dto';
import { instanceToPlain } from 'class-transformer';
import { HttpException } from '@/exceptions/HttpException';

export class InputController {
  constructor(private readonly inputService: InputService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateInputDto = req.body;
      const input = await this.inputService.create(data);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(input),
        message: 'Insumo creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inputs = await this.inputService.findAll();

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(inputs),
        count: inputs.length,
        message: 'Insumos obtenidos exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateInputDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del insumo es requerido.');
      }

      const updated = await this.inputService.update(id, data);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(updated),
        message: 'Insumo actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del insumo es requerido.');
      }

      const deleted = await this.inputService.delete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deleted),
        message: 'Insumo eliminado exitosamente',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };
}
