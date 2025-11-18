import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ShipmentController } from '@controllers/shipment.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';

export const createShipmentRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const shipmentController = new ShipmentController(dataSource);

  router.use(authenticate);

  /**
   * @route   GET /shipments
   * @desc    Obtener todos los envíos
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    shipmentController.getAllShipments
  );

  /**
   * @route   GET /shipments/:id
   * @desc    Obtener un envío por su ID
   * @access  ADMIN, CAPATAZ
   */
  router.get(
    '/:id',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    shipmentController.getShipmentById
  );

  return router;
};
