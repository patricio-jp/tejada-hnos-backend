import { DataSource } from 'typeorm';
import { Field } from '@/entities/field.entity';
import { Plot } from '@/entities/plot.entity';
import { WorkOrder } from '@/entities/work-order.entity';
import { Activity } from '@/entities/activity.entity';
import { Variety } from '@/entities/variety.entity';
import { User } from '@/entities/user.entity';
import { Input } from '@/entities/input.entity';
import { InputUsage } from '@/entities/input-usage.entity';
import { WorkOrderStatus, ActivityType, ActivityStatus, InputUnit } from '@/enums';
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

