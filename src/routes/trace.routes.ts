import { Router } from 'express';
import { DataSource } from 'typeorm';
import { TraceController } from '@controllers/trace.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { authorize } from '@middlewares/authorize.middleware';
import { UserRole } from '@/enums';

export const createTraceRoutes = (dataSource: DataSource): Router => {
  const router = Router();
  const traceController = new TraceController(dataSource);

  router.use(authenticate);

  router.get(
    '/:shipmentLotDetailId',
    authorize(UserRole.ADMIN, UserRole.CAPATAZ),
    traceController.getTraceability,
  );

  return router;
};
