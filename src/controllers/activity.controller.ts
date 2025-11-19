import { DataSource } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { ActivityService } from "@/services/activity.service";
import { HttpException } from "@/exceptions/HttpException";
import { StatusCodes } from "http-status-codes";
import { CreateActivityDto, UpdateActivityDto } from "@/dtos/activity.dto";
import { ActivityFilters } from "@/interfaces/filters.interface";
import { ActivityType, ActivityStatus, UserRole, WorkOrderStatus } from "@/enums";
import { instanceToPlain } from "class-transformer";

export class ActivityController {
  private activityService: ActivityService;

  constructor(dataSource: DataSource) {
    this.activityService = new ActivityService(dataSource);
  }

  /**
   * GET /activities
   * GET /work-orders/:workOrderId/activities
   * Obtener todas las actividades con filtros opcionales
   */
  public getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: ActivityFilters = {};

      if (req.query.workOrderId) {
        filters.workOrderId = req.query.workOrderId as string;
      }

      if (req.query.type) {
        filters.type = req.query.type as ActivityType;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      // Priorizar requiredAssignedToId (forzado por middleware) sobre query param
      if (req.requiredAssignedToId) {
        filters.assignedToId = req.requiredAssignedToId;
      } else if (req.query.assignedToId) {
        filters.assignedToId = req.query.assignedToId as string;
      }

      // Agregar managedFieldIds desde el middleware de autorización (para CAPATAZ)
      if (req.managedFieldIds && req.managedFieldIds.length > 0) {
        filters.managedFieldIds = req.managedFieldIds;
        
        // NO agregar assignedToId automáticamente para CAPATAZ con campos
        // El OR en el servicio ya maneja mostrar OTs en sus campos gestionados
        // Si el usuario filtra explícitamente por assignedToId, respetar ese filtro (ya está en filters.assignedToId de arriba)
      }

      const activities = await this.activityService.findAll(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(activities),
        count: activities.length,
        message: 'Actividades obtenidas exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /activities/:id
   * Obtener una actividad por su ID
   */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const activity = await this.activityService.findById(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(activity),
        message: 'Actividad obtenida exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /work-orders/:workOrderId/activities
   * Crear una nueva actividad (registro de trabajo realizado)
   * 
   * FLUJO:
   * - Solo se puede crear si WorkOrder está IN_PROGRESS
   * - Si WorkOrder está UNDER_REVIEW → BLOQUEADO (nadie puede crear)
   * - Para agregar actividad faltante: devolver WorkOrder a IN_PROGRESS
   * 
   * ROLES:
   * - OPERARIO: Crea como PENDING (solo en órdenes asignadas)
   * - CAPATAZ/ADMIN: Pueden crear como APPROVED
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workOrderId } = req.params;
      if (!workOrderId) 
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la orden de trabajo es requerido para crear una actividad.');
    
      const activityData: CreateActivityDto = req.body;
      
      // Obtener la WorkOrder para verificar su estado (VALIDACIÓN UNIVERSAL)
      const workOrder = await this.activityService.getWorkOrderById(workOrderId);
      
      // REGLA UNIVERSAL: Nadie puede crear actividades si WorkOrder no está IN_PROGRESS
      if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
        throw new HttpException(
          StatusCodes.FORBIDDEN,
          `No se pueden crear actividades en una orden con estado ${workOrder.status}. ` +
          'Solo se pueden agregar actividades mientras la orden está en progreso (IN_PROGRESS). ' +
          (workOrder.status === WorkOrderStatus.UNDER_REVIEW 
            ? 'Si falta una actividad, devuelve la orden a IN_PROGRESS primero.'
            : '')
        );
      }
      
      // OPERARIO: Validaciones adicionales
      if (req.user?.role === UserRole.OPERARIO) {
        // Verificar que sea el operario asignado
        if (workOrder.assignedToId !== req.user.userId) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'Solo puedes registrar actividades en órdenes asignadas a ti.'
          );
        }

        // Forzar PENDING para operarios
        activityData.status = ActivityStatus.PENDING;
      } else {
        // CAPATAZ/ADMIN: pueden crear directamente como APPROVED
        if (!activityData.status) {
          // Si no especifica status, usar APPROVED por defecto
          activityData.status = ActivityStatus.APPROVED;
        }
      }
      
      const newActivity = await this.activityService.create(activityData);

      res.status(StatusCodes.CREATED).json({
        data: instanceToPlain(newActivity),
        message: 'Actividad registrada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /activities/:id
   * Actualizar una actividad por su ID
   * 
   * FLUJO DE ESTADOS Y CONTROL DE STOCK:
   * 1. Operario registra actividad → PENDING (stock NO descontado)
   * 2. Mientras WorkOrder está IN_PROGRESS: se puede editar libremente
   * 3. Cuando WorkOrder pasa a UNDER_REVIEW: CONGELADO (nadie puede editar)
   * 4. Capataz puede aprobar/rechazar sin necesidad de editar
   * 5. Si está APPROVED/REJECTED → INMUTABLE (integridad del historial)
   * 
   * REGLAS DE MODIFICACIÓN:
   * - NADIE puede editar actividades si WorkOrder está en UNDER_REVIEW o COMPLETED
   * - Para editar: devolver WorkOrder a IN_PROGRESS primero
   * 
   * - OPERARIO (solo si WorkOrder = IN_PROGRESS): 
   *   - Puede editar actividades PENDING (datos, inputs, horas)
   *   - NO puede cambiar status a APPROVED/REJECTED
   * 
   * - CAPATAZ/ADMIN (solo si WorkOrder = IN_PROGRESS):
   *   - Pueden editar actividades PENDING
   *   - Pueden aprobar/rechazar EN CUALQUIER MOMENTO (incluso si WorkOrder = UNDER_REVIEW)
   * 
   * - TODOS: APPROVED y REJECTED son INMUTABLES siempre
   */
  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const activityData: UpdateActivityDto = req.body;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      // Obtener la actividad para verificar su estado actual
      const currentActivity = await this.activityService.findById(id);

      // REGLA UNIVERSAL: Las actividades APPROVED o REJECTED son INMUTABLES
      // Garantiza integridad del historial y trazabilidad de stock/horas
      if (currentActivity.status === ActivityStatus.APPROVED || currentActivity.status === ActivityStatus.REJECTED) {
        throw new HttpException(
          StatusCodes.FORBIDDEN,
          `No puedes modificar una actividad ${currentActivity.status === ActivityStatus.APPROVED ? 'aprobada' : 'rechazada'}. ` +
          'Debes crear una nueva actividad para registrar correcciones. ' +
          'Esto garantiza la integridad del historial y la trazabilidad de las operaciones.'
        );
      }

      // Verificar el estado de la WorkOrder
      const workOrder = currentActivity.workOrder;

      // Limpiar campos undefined de activityData
      Object.keys(activityData).forEach(key => {
        if (activityData[key as keyof UpdateActivityDto] === undefined) {
          delete activityData[key as keyof UpdateActivityDto];
        }
      });
      
      // Si solo está cambiando status a APPROVED/REJECTED (aprobación/rechazo)
      const isApprovalAction = activityData.status !== undefined && 
                               (activityData.status === ActivityStatus.APPROVED || 
                                activityData.status === ActivityStatus.REJECTED) &&
                               Object.keys(activityData).length === 1; // Solo cambia status

      // CAPATAZ/ADMIN pueden aprobar/rechazar en cualquier momento
      if (isApprovalAction && (req.user?.role === UserRole.CAPATAZ || req.user?.role === UserRole.ADMIN)) {
        // Permitir aprobación/rechazo sin importar estado de WorkOrder
        const updatedActivity = await this.activityService.update(id, activityData);
        return res.status(StatusCodes.OK).json({
          data: instanceToPlain(updatedActivity),
          message: 'Actividad actualizada exitosamente.',
        });
      }

      // REGLA UNIVERSAL: No se puede editar contenido si WorkOrder no está IN_PROGRESS
      if (workOrder.status !== WorkOrderStatus.IN_PROGRESS) {
        throw new HttpException(
          StatusCodes.FORBIDDEN,
          `No puedes modificar actividades de una orden con estado ${workOrder.status}. ` +
          'Solo se pueden editar actividades mientras la orden está en progreso (IN_PROGRESS). ' +
          (workOrder.status === WorkOrderStatus.UNDER_REVIEW 
            ? 'Si necesitas corregir algo, devuelve la orden a IN_PROGRESS primero.'
            : '')
        );
      }

      // OPERARIO: Validaciones adicionales
      if (req.user?.role === UserRole.OPERARIO) {
        // No puede cambiar el status a APPROVED o REJECTED
        if (activityData.status !== undefined && activityData.status !== ActivityStatus.PENDING) {
          throw new HttpException(
            StatusCodes.FORBIDDEN,
            'Un operario no puede aprobar o rechazar actividades. Solo un capataz o administrador puede hacerlo.'
          );
        }
      }

      const updatedActivity = await this.activityService.update(id, activityData);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(updatedActivity),
        message: 'Actividad actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:id
   * Eliminar una actividad (soft delete)
   */
  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const deletedActivity = await this.activityService.delete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedActivity),
        message: 'Actividad eliminada exitosamente.',
        canRestore: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /activities/:id/restore
   * Restaurar una actividad eliminada
   */
  public restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const restoredActivity = await this.activityService.restore(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(restoredActivity),
        message: 'Actividad restaurada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /activities/:id/permanent
   * Eliminar permanentemente una actividad (hard delete)
   */
  public hardDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID de la actividad es requerido.');
      }

      const deletedActivity = await this.activityService.hardDelete(id);

      res.status(StatusCodes.OK).json({
        data: instanceToPlain(deletedActivity),
        message: 'Actividad eliminada permanentemente.',
        canRestore: false,
      });
    } catch (error) {
      next(error);
    }
  };
}
