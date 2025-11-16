import { Router } from 'express';
import { DataSource } from 'typeorm';
import { SalesOrderController } from '@controllers/sale-order.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';
import { validateData } from '@middlewares/validation.middleware';
import { CreateSalesOrderDto, UpdateSalesOrderDto, UpdateSalesOrderStatusDto } from '@dtos/sales-order.dto';

export const createSalesOrderRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const salesOrderController = new SalesOrderController(dataSource);

  router.use(authenticate);

  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    salesOrderController.getAll
  );

  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    salesOrderController.getById
  );

  router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(CreateSalesOrderDto),
    salesOrderController.create
  );

  router.put(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    validateData(UpdateSalesOrderDto),
    salesOrderController.update
  );

  router.patch(
    '/:id/status',
    authorize(UserRole.ADMIN),
    validateData(UpdateSalesOrderStatusDto),
    salesOrderController.updateStatus
  );

  router.delete(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    salesOrderController.delete
  );

  router.patch(
    '/:id/restore',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    salesOrderController.restore
  );

  router.delete(
    '/:id/permanent',
    authorize(UserRole.ADMIN),
    salesOrderController.hardDelete
  );

  return router;
};
