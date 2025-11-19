import { DataSource } from 'typeorm';
import { Field } from '@/entities/field.entity';
import { Plot } from '@/entities/plot.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { Variety } from '@/entities/variety.entity';
import { User } from '@/entities/user.entity';
import { Input } from '@/entities/input.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { Customer } from '@/entities/customer.entity';
import { HarvestLot } from '@/entities/harvest-lot.entity';
import { SalesOrder } from '@/entities/sale-order.entity';
import { Shipment } from '@/entities/shipment.entity';
import { Supplier } from '@/entities/supplier.entity';
import { PurchaseOrder } from '@/entities/purchase-order.entity';
import { PurchaseOrderDetail } from '@/entities/purchase-order-detail.entity';
import { WorkOrderStatus, ActivityType, ActivityStatus, InputUnit, HarvestLotStatus, WalnutCaliber, SalesOrderStatus, PurchaseOrderStatus } from '@/enums';
import { GeoJSONPolygon } from '@/types';

/**
 * Creates a test field
 */
export const createTestField = async (
  dataSource: DataSource,
  data: {
    name: string;
    area: number;
    address: string;
    managerId?: string | null;
  }
): Promise<Field> => {
  const fieldRepository = dataSource.getRepository(Field);
  
  const field = fieldRepository.create({
    name: data.name,
    area: data.area,
    address: data.address,
    location: createMockPolygon(),
    managerId: data.managerId || null,
  });

  return await fieldRepository.save(field);
};

/**
 * Creates a test plot
 */
export const createTestPlot = async (
  dataSource: DataSource,
  data: {
    name: string;
    area: number;
    fieldId: string;
    varietyId?: string;
    datePlanted?: Date;
  }
): Promise<Plot> => {
  const plotRepository = dataSource.getRepository(Plot);
  
  const plot = plotRepository.create({
    name: data.name,
    area: data.area,
    fieldId: data.fieldId,
    varietyId: data.varietyId || null,
    datePlanted: data.datePlanted || null,
    location: createMockPolygon(),
  } as Partial<Plot>);

  return await plotRepository.save(plot);
};

/**
 * Creates a test variety
 */
export const createTestVariety = async (
  dataSource: DataSource,
  data: {
    name: string;
    description?: string;
  }
): Promise<Variety> => {
  const varietyRepository = dataSource.getRepository(Variety);
  
  const variety = varietyRepository.create({
    name: data.name,
    description: data.description || '',
  });

  return await varietyRepository.save(variety);
};

/**
 * Creates a test work order
 */
export const createTestWorkOrder = async (
  dataSource: DataSource,
  data: {
    title: string;
    description: string;
    scheduledDate: Date;
    dueDate: Date;
    assignedToId?: string | null;
    plotIds?: string[];
    status?: WorkOrderStatus;
  }
): Promise<WorkOrder> => {
  const workOrderRepository = dataSource.getRepository(WorkOrder);
  const plotRepository = dataSource.getRepository(Plot);
  
  const workOrder = workOrderRepository.create({
    title: data.title,
    description: data.description,
    scheduledDate: data.scheduledDate,
    dueDate: data.dueDate,
    assignedToId: data.assignedToId || null,
    status: data.status || WorkOrderStatus.PENDING,
  });

  const savedWorkOrder = await workOrderRepository.save(workOrder);

  // Assign plots if provided
  if (data.plotIds && data.plotIds.length > 0) {
    const plots = await plotRepository.findByIds(data.plotIds);
    savedWorkOrder.plots = plots;
    await workOrderRepository.save(savedWorkOrder);
  }

  return savedWorkOrder;
};

/**
 * Creates a test activity
 */
export const createTestActivity = async (
  dataSource: DataSource,
  data: {
    workOrderId: string;
    type: ActivityType;
    executionDate: Date;
    hoursWorked: number;
    status?: ActivityStatus;
    details?: any;
  }
): Promise<Activity> => {
  const activityRepository = dataSource.getRepository(Activity);
  
  const activity = activityRepository.create({
    workOrderId: data.workOrderId,
    type: data.type,
    executionDate: data.executionDate,
    hoursWorked: data.hoursWorked,
    status: data.status || ActivityStatus.PENDING,
    details: data.details || {},
  });

  return await activityRepository.save(activity);
};

/**
 * Creates a test input
 */
export const createTestInput = async (
  dataSource: DataSource,
  data: {
    name: string;
    unit: InputUnit;
    stock?: number;
    costPerUnit?: number;
  }
): Promise<Input> => {
  const inputRepository = dataSource.getRepository(Input);
  
  const input = inputRepository.create({
    name: data.name,
    unit: data.unit,
    stock: data.stock || 0,
    costPerUnit: data.costPerUnit || 0,
  });

  return await inputRepository.save(input);
};

/**
 * Creates a test input usage
 */
export const createTestInputUsage = async (
  dataSource: DataSource,
  data: {
    activityId: string;
    inputId: string;
    quantityUsed: number;
  }
): Promise<InputUsage> => {
  const inputUsageRepository = dataSource.getRepository(InputUsage);
  
  const inputUsage = inputUsageRepository.create({
    activityId: data.activityId,
    inputId: data.inputId,
    quantityUsed: data.quantityUsed,
  });

  return await inputUsageRepository.save(inputUsage);
};

/**
 * Creates a mock GeoJSON polygon for testing
 */
export const createMockPolygon = (): GeoJSONPolygon => {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [-70.6483, -33.4569],
        [-70.6482, -33.4569],
        [-70.6482, -33.4570],
        [-70.6483, -33.4570],
        [-70.6483, -33.4569],
      ],
    ],
  };
};

/**
 * Sets up a complete field-plot scenario for testing
 */
export const setupFieldPlotScenario = async (
  dataSource: DataSource,
  capatazId: string
) => {
  // Create variety
  const variety = await createTestVariety(dataSource, {
    name: 'Cabernet Sauvignon',
    description: 'Red wine grape',
  });

  // Create fields: one managed by capataz, one without manager
  const managedField = await createTestField(dataSource, {
    name: 'Campo A',
    area: 100,
    address: 'Ruta 123 km 45',
    managerId: capatazId,
  });

  const unmanagedField = await createTestField(dataSource, {
    name: 'Campo X',
    area: 80,
    address: 'Ruta 456 km 78',
    managerId: null,
  });

  // Create plots
  const managedPlot = await createTestPlot(dataSource, {
    name: 'Parcela A1',
    area: 25,
    fieldId: managedField.id,
    varietyId: variety.id,
  });

  const unmanagedPlot = await createTestPlot(dataSource, {
    name: 'Parcela X1',
    area: 20,
    fieldId: unmanagedField.id,
    varietyId: variety.id,
  });

  return {
    variety,
    managedField,
    unmanagedField,
    managedPlot,
    unmanagedPlot,
  };
};

/**
 * Sets up a complete work order scenario for testing
 */
export const setupWorkOrderScenario = async (
  dataSource: DataSource,
  data: {
    capatazId: string;
    operarioId: string;
  }
) => {
  const scenario = await setupFieldPlotScenario(dataSource, data.capatazId);

  // Create work orders
  const assignedWorkOrder = await createTestWorkOrder(dataSource, {
    title: 'Poda de invierno',
    description: 'Realizar poda de invierno en parcelas',
    scheduledDate: new Date('2025-06-01'),
    dueDate: new Date('2025-06-15'),
    assignedToId: data.operarioId,
    plotIds: [scenario.managedPlot.id],
    status: WorkOrderStatus.IN_PROGRESS,
  });

  const unassignedWorkOrder = await createTestWorkOrder(dataSource, {
    title: 'Fertilización',
    description: 'Aplicar fertilizante',
    scheduledDate: new Date('2025-06-10'),
    dueDate: new Date('2025-06-20'),
    assignedToId: null,
    plotIds: [scenario.unmanagedPlot.id],
    status: WorkOrderStatus.PENDING,
  });

  // Create activities
  const pendingActivity = await createTestActivity(dataSource, {
    workOrderId: assignedWorkOrder.id,
    type: ActivityType.PODA,
    executionDate: new Date('2025-06-02'),
    hoursWorked: 5,
    status: ActivityStatus.PENDING,
  });

  const approvedActivity = await createTestActivity(dataSource, {
    workOrderId: assignedWorkOrder.id,
    type: ActivityType.PODA,
    executionDate: new Date('2025-06-03'),
    hoursWorked: 6,
    status: ActivityStatus.APPROVED,
  });

  return {
    ...scenario,
    assignedWorkOrder,
    unassignedWorkOrder,
    pendingActivity,
    approvedActivity,
  };
};

/**
 * Creates a test customer
 */
export const createTestCustomer = async (
  dataSource: DataSource,
  data: {
    name: string;
    taxId?: string;
    address?: string;
    contactEmail?: string;
    phoneNumber?: string;
  }
): Promise<Customer> => {
  const customerRepository = dataSource.getRepository(Customer);
  
  const customer = customerRepository.create({
    name: data.name,
    taxId: data.taxId || null,
    address: data.address || null,
    contactEmail: data.contactEmail || null,
    phoneNumber: data.phoneNumber || null,
  } as Partial<Customer>);

  return await customerRepository.save(customer);
};

/**
 * Creates a test harvest lot
 */
export const createTestHarvestLot = async (
  dataSource: DataSource,
  data: {
    plotId: string;
    harvestDate: Date;
    lotCode?: string;
    varietyName?: string;
    caliber?: WalnutCaliber;
    grossWeightKg: number;
    netWeightKg?: number;
    status?: HarvestLotStatus;
  }
): Promise<HarvestLot> => {
  const harvestLotRepository = dataSource.getRepository(HarvestLot);
  
  const harvestLot = harvestLotRepository.create({
    plotId: data.plotId,
    harvestDate: data.harvestDate,
    lotCode: data.lotCode || `LOT-${Date.now()}`,
    varietyName: data.varietyName || 'Nuez Sin Clasificar',
    caliber: data.caliber || null,
    grossWeightKg: data.grossWeightKg,
    netWeightKg: data.netWeightKg || null,
    remainingNetWeightKg: data.netWeightKg || null,
    status: data.status || HarvestLotStatus.PENDIENTE_PROCESO,
  } as Partial<HarvestLot>);

  return await harvestLotRepository.save(harvestLot);
};

/**
 * Creates a test sales order with details
 */
export const createTestSalesOrder = async (
  dataSource: DataSource,
  data: {
    customerId: string;
    status?: SalesOrderStatus;
    details: Array<{
      caliber: string;
      variety: string;
      quantityKg: number;
      unitPrice: number;
    }>;
  }
): Promise<SalesOrder> => {
  const salesOrderRepository = dataSource.getRepository(SalesOrder);
  
  // First, create and save the sales order WITHOUT details
  const salesOrder = salesOrderRepository.create({
    customerId: data.customerId,
    status: data.status || SalesOrderStatus.PENDIENTE,
  } as Partial<SalesOrder>);

  const savedOrder = await salesOrderRepository.save(salesOrder);

  // Calculate total amount
  const totalAmount = data.details.reduce((sum, detail) => {
    return sum + (detail.quantityKg * detail.unitPrice);
  }, 0);

  // Now insert the details using query builder
  if (data.details && data.details.length > 0) {
    await dataSource
      .createQueryBuilder()
      .insert()
      .into('sales_order_details')
      .values(
        data.details.map(detail => ({
          salesOrderId: savedOrder.id,
          caliber: detail.caliber,
          variety: detail.variety,
          quantityKg: detail.quantityKg,
          unitPrice: detail.unitPrice,
          quantityShipped: 0,
          status: 'PENDIENTE',
        }))
      )
      .execute();
  }

  // Update the total amount
  await salesOrderRepository.update(savedOrder.id, { totalAmount });

  // Reload the order with details
  const orderWithDetails = await salesOrderRepository.findOne({
    where: { id: savedOrder.id },
    relations: ['details', 'customer'],
  });

  return orderWithDetails!;
};

/**
 * Sets up a complete harvest scenario for testing
 */
export const setupHarvestScenario = async (
  dataSource: DataSource,
  capatazId: string
) => {
  // Create field and plot
  const field = await createTestField(dataSource, {
    name: 'Campo Nogales',
    area: 100,
    address: 'Ruta Nogales 123',
    managerId: capatazId,
  });

  const variety = await createTestVariety(dataSource, {
    name: 'Serr',
    description: 'Variedad de nogal Serr',
  });

  const plot = await createTestPlot(dataSource, {
    name: 'Parcela Nogales 1',
    area: 25,
    fieldId: field.id,
    varietyId: variety.id,
  });

  // Create harvest lots in different states
  const pendingLot = await createTestHarvestLot(dataSource, {
    plotId: plot.id,
    harvestDate: new Date('2025-03-15'),
    lotCode: 'LOT-001-PENDING',
    varietyName: 'Serr',
    grossWeightKg: 1000,
    status: HarvestLotStatus.PENDIENTE_PROCESO,
  });

  const inStockLot = await createTestHarvestLot(dataSource, {
    plotId: plot.id,
    harvestDate: new Date('2025-03-10'),
    lotCode: 'LOT-002-STOCK',
    varietyName: 'Serr',
    caliber: WalnutCaliber.JUMBO,
    grossWeightKg: 2000,
    netWeightKg: 1600,
    status: HarvestLotStatus.EN_STOCK,
  });

  return {
    field,
    variety,
    plot,
    pendingLot,
    inStockLot,
  };
};

/**
 * Sets up a complete sales scenario for testing
 */
export const setupSalesScenario = async (
  dataSource: DataSource,
  capatazId: string,
  salesOrderStatus?: SalesOrderStatus
) => {
  // Create harvest data
  const harvestScenario = await setupHarvestScenario(dataSource, capatazId);

  // Create customer
  const customer = await createTestCustomer(dataSource, {
    name: 'Cliente Test S.A.',
    taxId: '76543210-K',
    address: 'Av. Principal 456',
    contactEmail: 'contacto@clientetest.cl',
    phoneNumber: '+56912345678',
  });

  // Create sales order - PENDIENTE por defecto, pero puede especificarse otro estado
  const salesOrder = await createTestSalesOrder(dataSource, {
    customerId: customer.id,
    status: salesOrderStatus || SalesOrderStatus.PENDIENTE,
    details: [
      {
        caliber: WalnutCaliber.JUMBO,
        variety: 'Serr',
        quantityKg: 500,
        unitPrice: 15.50,
      },
      {
        caliber: WalnutCaliber.LARGE,
        variety: 'Serr',
        quantityKg: 300,
        unitPrice: 12.75,
      },
    ],
  });

  return {
    ...harvestScenario,
    customer,
    salesOrder,
  };
};

/**
 * Creates a test supplier
 */
export const createTestSupplier = async (
  dataSource: DataSource,
  data: {
    name: string;
    contactEmail: string;
    taxId?: string;
    phoneNumber?: string;
    address?: string;
  }
) => {
  const supplierRepository = dataSource.getRepository(Supplier);
  
  const supplier = supplierRepository.create({
    name: data.name,
    contactEmail: data.contactEmail,
    taxId: data.taxId || `${Math.floor(Math.random() * 100000000)}-${Math.floor(Math.random() * 10)}`,
    phoneNumber: data.phoneNumber || '+56912345678',
    address: data.address || 'Address test',
  });

  return await supplierRepository.save(supplier);
};

/**
 * Creates a test purchase order
 */
export const createTestPurchaseOrder = async (
  dataSource: DataSource,
  data: {
    supplierId: string;
    status?: PurchaseOrderStatus;
    details: Array<{
      inputId: string;
      quantity: number;
      unitPrice: number;
    }>;
  }
) => {
  const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
  
  // Calculate total amount
  const totalAmount = data.details.reduce((sum, detail) => {
    return sum + (detail.quantity * detail.unitPrice);
  }, 0);

  // Create purchase order
  const purchaseOrder = purchaseOrderRepository.create({
    supplierId: data.supplierId,
    status: data.status || PurchaseOrderStatus.PENDIENTE,
    totalAmount,
  });

  const savedOrder = await purchaseOrderRepository.save(purchaseOrder);

  // Insert details using query builder
  if (data.details && data.details.length > 0) {
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(PurchaseOrderDetail)
      .values(
        data.details.map(detail => ({
          purchaseOrderId: savedOrder.id,
          inputId: detail.inputId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
        }))
      )
      .execute();
  }

  // Reload with relations
  const orderWithDetails = await purchaseOrderRepository.findOne({
    where: { id: savedOrder.id },
    relations: ['details', 'details.input', 'supplier'],
  });

  return orderWithDetails!;
};

/**
 * Setup a complete purchase scenario with supplier and inputs
 */
export const setupPurchaseScenario = async (
  dataSource: DataSource,
  purchaseOrderStatus: PurchaseOrderStatus = PurchaseOrderStatus.PENDIENTE
) => {
  // Create supplier
  const supplier = await createTestSupplier(dataSource, {
    name: 'Proveedor Test S.A.',
    contactEmail: 'proveedor@test.cl',
    taxId: '76543210-5',
    phoneNumber: '+56987654321',
    address: 'Calle Principal 123',
  });

  // Create inputs
  const fertilizerInput = await createTestInput(dataSource, {
    name: 'Fertilizante NPK',
    unit: InputUnit.KG,
    costPerUnit: 5.50,
    stock: 100,
  });

  const pesticideInput = await createTestInput(dataSource, {
    name: 'Pesticida Orgánico',
    unit: InputUnit.LITRO,
    costPerUnit: 12.00,
    stock: 50,
  });

  // Create purchase order
  const purchaseOrder = await createTestPurchaseOrder(dataSource, {
    supplierId: supplier.id,
    status: purchaseOrderStatus,
    details: [
      {
        inputId: fertilizerInput.id,
        quantity: 500,
        unitPrice: 5.00,
      },
      {
        inputId: pesticideInput.id,
        quantity: 200,
        unitPrice: 11.50,
      },
    ],
  });

  return {
    supplier,
    fertilizerInput,
    pesticideInput,
    purchaseOrder,
  };
};

