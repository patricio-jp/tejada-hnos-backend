import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import { DataSource } from 'typeorm';
import { errorHandler } from '@/middlewares/error-handler.middleware';

import { createAuthRoutes } from '@/routes/auth.routes';
import { createUserRoutes } from '@/routes/user.routes';
import { createFieldRoutes } from '@/routes/field.routes';
import { createPlotRoutes } from '@/routes/plot.routes';
import { createActivityRoutes } from '@/routes/activity.routes';
import { createWorkOrderRoutes } from '@/routes/work-order.routes';
import { createHarvestLotRoutes } from '@/routes/harvest-lot.routes';
import { createCustomerRoutes } from '@/routes/customer.routes';
import { createSupplierRoutes } from '@/routes/supplier.routes';
import { createVarietyRoutes } from '@/routes/variety.routes';
import { createPurchaseOrderRoutes } from '@/routes/purchase-order.routes';
import { createInputRoutes } from '@/routes/input.routes';
import { createGoodsReceiptRoutes } from '@/routes/goods-receipt.routes';
import { createSalesOrderRoutes } from '../../src/routes/sale-order.routes';
import { createShipmentRoutes } from '../../src/routes/shipment.routes';

/**
 * Creates and configures an Express application for testing
 */
export const createTestApp = (dataSource: DataSource): Express => {
  // Set UTC timezone
  process.env.TZ = 'UTC';

  const app = express();

  // Configure Middlewares
  app.use(cors());
  app.use(express.json());

  // Configure Routes
  app.use('/auth', createAuthRoutes(dataSource));
  app.use('/users', createUserRoutes(dataSource));
  app.use('/fields', createFieldRoutes(dataSource));
  app.use('/plots', createPlotRoutes(dataSource));
  app.use('/work-orders', createWorkOrderRoutes(dataSource));
  app.use('/activities', createActivityRoutes(dataSource));
  app.use('/harvest-lots', createHarvestLotRoutes(dataSource));
  app.use('/customers', createCustomerRoutes(dataSource));
  app.use('/suppliers', createSupplierRoutes(dataSource));
  app.use('/varieties', createVarietyRoutes(dataSource));
  app.use('/purchase-orders', createPurchaseOrderRoutes(dataSource));
  app.use('/inputs', createInputRoutes(dataSource));
  app.use('/goods-receipts', createGoodsReceiptRoutes(dataSource));
  app.use('/sales-orders', createSalesOrderRoutes(dataSource));
  app.use('/shipments', createShipmentRoutes(dataSource));

  // Configure Error Handler
  app.use(errorHandler);

  return app;
};
