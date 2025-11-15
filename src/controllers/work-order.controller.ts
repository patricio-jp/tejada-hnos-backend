import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { WorkOrderService } from '@services/work-order.service';
import { WorkOrderFilters } from '@/interfaces/filters.interface';
import { CreateWorkOrderDto, UpdateWorkOrderDto } from '@dtos/work-order.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataSource } from 'typeorm';
import { WorkOrderStatus, UserRole } from '@/enums';
import { instanceToPlain } from 'class-transformer';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor(dataSource: DataSource) {
    this.workOrderService = new WorkOrderService(dataSource);
  }

  /**
   * GET /work-orders
   * Obtener todas las órdenes de trabajo con filtros opcionales
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Construir filtros desde query params
      const filters: WorkOrderFilters = {};

      if (req.query.status) {
        filters.status = req.query.status as WorkOrderStatus;
      }

      // Priorizar requiredAssignedToId (forzado por middleware) sobre query param
      if (req.requiredAssignedToId) {
        filters.assignedToId = req.requiredAssignedToId;
      } else if (req.query.assignedToId) {
        filters.assignedToId = req.query.assignedToId as string;
      }

      if (req.query.plotId) {
        filters.plotId = req.query.plotId as string;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Agregar managedFieldIds desde el middleware de autorización (para CAPATAZ)
      if (req.managedFieldIds && req.managedFieldIds.length > 0) {
        filters.managedFieldIds = req.managedFieldIds;
      }

      // Pasar filtros solo si hay al menos uno definido
      const workOrders = await this.workOrderService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(workOrders),
        count: workOrders.length,
        message: 'Órdenes de trabajo obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /work-orders/:id
   * Obtener una orden de trabajo por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const workOrder = await this.workOrderService.findById(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(workOrder),
        message: 'Orden de trabajo obtenida exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders
   * Crear una nueva orden de trabajo
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workOrderData: CreateWorkOrderDto = req.body;
      const newWorkOrder = await this.workOrderService.create(workOrderData);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(newWorkOrder),
        message: 'Orden de trabajo creada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /work-orders/:id
   * Actualizar una orden de trabajo por su ID
   * 
   * FLUJO DE ESTADOS:
   * - PENDING: Asignada, no iniciada
   * - IN_PROGRESS: Operario está trabajando
   * - UNDER_REVIEW: Operario terminó, esperando aprobación de capataz
   * - COMPLETED: Capataz revisó y aprobó
   * - CANCELLED: Cancelada por capataz/admin
   * 
   * PERMISOS:
   * - OPERARIO (asignado): Puede cambiar de PENDING → IN_PROGRESS → UNDER_REVIEW
   * - CAPATAZ/ADMIN: Pueden cambiar a cualquier estado
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const workOrderData: UpdateWorkOrderDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      // Obtener la orden actual para validar permisos
      const currentWorkOrder = await this.workOrderService.findById(id);

      // OPERARIO: Solo puede actualizar si está asignado a él
      if (req.user?.role === UserRole.OPERARIO) {
        // Verificar que sea el operario asignado
        if (currentWorkOrder.assignedToId !== req.user.userId) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'Solo puedes actualizar órdenes de trabajo asignadas a ti.'
          );
        }

        // Si intenta cambiar el status, validar transiciones permitidas
        if (workOrderData.status !== undefined) {
          const allowedTransitions: Record<string, WorkOrderStatus[]> = {
            [WorkOrderStatus.PENDING]: [WorkOrderStatus.IN_PROGRESS],
            [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.UNDER_REVIEW],
            [WorkOrderStatus.UNDER_REVIEW]: [], // No puede cambiar desde aquí
          };

          const allowed = allowedTransitions[currentWorkOrder.status] || [];
          
          if (!allowed.includes(workOrderData.status)) {
            throw new HttpException(
              StatusCodes.FORBIDDEN,
              `No puedes cambiar el estado de esta orden desde ${currentWorkOrder.status} a ${workOrderData.status}. ` +
              `Transiciones permitidas: ${allowed.join(', ') || 'ninguna (espera aprobación del capataz)'}.`
            );
          }
        }

        // Operario no puede modificar otros campos (solo status en transiciones permitidas)
        const allowedFields = ['status'];
        // Filtrar solo campos que tienen valor (no undefined)
        const attemptedFields = Object.keys(workOrderData).filter(
          key => workOrderData[key as keyof UpdateWorkOrderDto] !== undefined
        );
        const invalidFields = attemptedFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            `Un operario solo puede actualizar el estado de la orden. Campos no permitidos: ${invalidFields.join(', ')}`
          );
        }
      }

      // CAPATAZ/ADMIN: Validaciones adicionales
      if (req.user?.role === UserRole.CAPATAZ || req.user?.role === UserRole.ADMIN) {
        // Si intenta cambiar el status, validar transiciones permitidas
        if (workOrderData.status !== undefined && workOrderData.status !== currentWorkOrder.status) {
          // Definir transiciones permitidas para CAPATAZ/ADMIN
          const allowedTransitions: Record<string, WorkOrderStatus[]> = {
            [WorkOrderStatus.PENDING]: [
              WorkOrderStatus.IN_PROGRESS,
              WorkOrderStatus.CANCELLED
            ],
            [WorkOrderStatus.IN_PROGRESS]: [
              WorkOrderStatus.UNDER_REVIEW,
              WorkOrderStatus.CANCELLED
            ],
            [WorkOrderStatus.UNDER_REVIEW]: [
              WorkOrderStatus.IN_PROGRESS,  // Reapertura (para agregar actividades faltantes)
              WorkOrderStatus.COMPLETED,    // Cierre (validado después)
              WorkOrderStatus.CANCELLED
            ],
            [WorkOrderStatus.COMPLETED]: [],  // No se puede cambiar desde COMPLETED
            [WorkOrderStatus.CANCELLED]: [],  // No se puede cambiar desde CANCELLED
          };

          const allowed = allowedTransitions[currentWorkOrder.status] || [];
          
          if (!allowed.includes(workOrderData.status)) {
            throw new HttpException(
              StatusCodes.BAD_REQUEST,
              `No puedes cambiar el estado de la orden desde ${currentWorkOrder.status} a ${workOrderData.status}. ` +
              `Transiciones permitidas: ${allowed.join(', ') || 'ninguna'}.`
            );
          }
        }

        // Validación adicional: al cerrar la orden, verificar que todas las actividades estén aprobadas/rechazadas
        if (workOrderData.status === WorkOrderStatus.COMPLETED) {
          const activities = currentWorkOrder.activities || [];
          const pendingActivities = activities.filter(
            activity => activity.status === 'PENDING'
          );

          if (pendingActivities.length > 0) {
            throw new HttpException(
              StatusCodes.BAD_REQUEST,
              `No puedes cerrar la orden. Hay ${pendingActivities.length} actividad(es) pendiente(s) de aprobación o rechazo. ` +
              'Todas las actividades deben estar aprobadas o rechazadas antes de cerrar la orden.'
            );
          }
        }
      }

      const updatedWorkOrder = await this.workOrderService.update(id, workOrderData);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(updatedWorkOrder),
        message: 'Orden de trabajo actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /work-orders/:id
   * Eliminar una orden de trabajo (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const deletedWorkOrder = await this.workOrderService.delete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedWorkOrder),
        message: 'Orden de trabajo eliminada exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders/:id/restore
   * Restaurar una orden de trabajo eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const restoredWorkOrder = await this.workOrderService.restore(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(restoredWorkOrder),
        message: 'Orden de trabajo restaurada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /work-orders/:id/permanent
   * Eliminar permanentemente una orden de trabajo (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido.');
      }

      const deletedWorkOrder = await this.workOrderService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedWorkOrder),
        message: 'Orden de trabajo eliminada permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
