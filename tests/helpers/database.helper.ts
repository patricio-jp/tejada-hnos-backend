import { DataSource } from 'typeorm';
import { ENV } from '@/config/environment';
import { User } from '@/entities/user.entity';
import { Field } from '@/entities/field.entity';
import { Plot } from '@/entities/plot.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { Variety } from '@/entities/variety.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { Input } from '@/entities/input.entity';
import { HarvestLot } from '@/entities/harvest-lot.entity';
import { Customer } from '@/entities/customer.entity';
import { Supplier } from '@/entities/supplier.entity';
import { PurchaseOrder } from '@/entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@/entities/purchase-order-detail.entity';
import { GoodsReceipt } from '@/entities/goods-receipt.entity';
import { GoodsReceiptDetail } from '@/entities/goods-receipt-detail.entity';
import { SalesOrder } from '@/entities/sale-order.entity';
import { SalesOrderDetail } from '@/entities/sale-order-detail.entity';
import { Shipment } from '@/entities/shipment.entity';
import { ShipmentLotDetail } from '@/entities/shipment-lot-detail.entity';

let testDataSource: DataSource | null = null;

/**
 * Creates and initializes a test database connection
 */
export const createTestDataSource = async (): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource({
    type: 'postgres',
    host: ENV.POSTGRES_HOST,
    port: Number(ENV.POSTGRES_PORT),
    username: ENV.POSTGRES_USERNAME,
    password: ENV.POSTGRES_PASSWORD,
    database: ENV.POSTGRES_DATABASE,
    entities: [
      User,
      Field,
      Plot,
      WorkOrder,
      Activity,
      Variety,
      Input,
      InputUsage,
      HarvestLot,
      Customer,
      Supplier,
      PurchaseOrder,
      PurchaseOrderDetail,
      GoodsReceipt,
      GoodsReceiptDetail,
      SalesOrder,
      SalesOrderDetail,
      Shipment,
      ShipmentLotDetail,
    ],
    synchronize: true, // Auto-create schema in test mode
    dropSchema: false, // Don't drop on each connection
    logging: false,
  });

  await testDataSource.initialize();
  return testDataSource;
};

/**
 * Closes the test database connection
 */
export const closeTestDataSource = async (): Promise<void> => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
};

/**
 * Clears all data from test database tables
 */
export const clearDatabase = async (dataSource: DataSource): Promise<void> => {
  // Disable foreign key checks temporarily
  await dataSource.query('SET session_replication_role = replica;');

  try {
    // Get all table names
    const tableNames = dataSource.entityMetadatas
      .map(metadata => `"${metadata.tableName}"`)
      .filter(name => name !== '"migrations"'); // Don't truncate migrations table
    
    // Truncate all tables at once
    if (tableNames.length > 0) {
      const tables = tableNames.join(', ');
      await dataSource.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
      //console.log(`✓ Cleared ${tableNames.length} tables`);
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  } finally {
    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
};

/**
 * Gets the current test data source
 */
export const getTestDataSource = (): DataSource => {
  if (!testDataSource || !testDataSource.isInitialized) {
    throw new Error('Test data source not initialized. Call createTestDataSource() first.');
  }
  return testDataSource;
};
