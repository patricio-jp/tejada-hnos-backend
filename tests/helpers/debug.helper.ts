import { DataSource } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Field } from '../../src/entities/field.entity';
import { Plot } from '../../src/entities/plot.entity';
import { WorkOrder } from '../../src/entities/work-order.entity';
import { Activity } from '../../src/entities/activity.entity';

/**
 * Helper para debugging de tests - imprime el estado actual de la base de datos
 */
export class TestDebugger {
  /**
   * Imprime todos los usuarios en la base de datos
   */
  static async printUsers(dataSource: DataSource, label = 'USERS') {
    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();
    
    const output = [`\n========== ${label} (${users.length}) ==========`];
    users.forEach(user => {
      const managedFieldsInfo = user.managedFields && user.managedFields.length > 0 
        ? `\n  Managed Fields: ${user.managedFields.map(f => f.id).join(', ')}` 
        : '';
      output.push(`- ${user.name} (${user.role}) [ID: ${user.id}]\n  Email: ${user.email}${managedFieldsInfo}`);
    });
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Imprime todos los fields en la base de datos
   */
  static async printFields(dataSource: DataSource, label = 'FIELDS') {
    const fieldRepository = dataSource.getRepository(Field);
    const fields = await fieldRepository.find({ relations: ['manager'] });
    
    const output = [`\n========== ${label} (${fields.length}) ==========`];
    fields.forEach(field => {
      output.push(`- ${field.name} [ID: ${field.id}]\n  Area: ${field.area} hectáreas\n  Manager: ${field.manager ? field.manager.name : 'SIN GESTOR'}\n  Address: ${field.address || 'N/A'}`);
    });
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Imprime todos los plots en la base de datos
   */
  static async printPlots(dataSource: DataSource, label = 'PLOTS') {
    const plotRepository = dataSource.getRepository(Plot);
    const plots = await plotRepository.find({ 
      relations: ['field', 'field.manager', 'variety'] 
    });
    
    const output = [`\n========== ${label} (${plots.length}) ==========`];
    plots.forEach(plot => {
      output.push(`- ${plot.name} [ID: ${plot.id}]\n  Field: ${plot.field.name} (Manager: ${plot.field.manager?.name || 'N/A'})\n  Area: ${plot.area} hectáreas\n  Variety: ${plot.variety?.name || 'N/A'}`);
    });
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Imprime todos los work orders en la base de datos
   */
  static async printWorkOrders(dataSource: DataSource, label = 'WORK ORDERS') {
    const workOrderRepository = dataSource.getRepository(WorkOrder);
    const workOrders = await workOrderRepository.find({ 
      relations: ['assignedTo', 'plots', 'plots.field', 'plots.field.manager'],
      withDeleted: true
    });
    
    const output = [`\n========== ${label} (${workOrders.length}) ==========`];
    workOrders.forEach(wo => {
      output.push(`- ${wo.title} [ID: ${wo.id}]\n  Status: ${wo.status}${wo.deletedAt ? ' (DELETED)' : ''}\n  Assigned To: ${wo.assignedTo?.name || 'Sin asignar'}\n  Scheduled: ${wo.scheduledDate.toISOString().split('T')[0]}\n  Plots (${wo.plots?.length || 0}):`);
      wo.plots?.forEach(plot => {
        output.push(`    - ${plot.name} (Field: ${plot.field.name}, Manager: ${plot.field.manager?.name || 'N/A'})`);
      });
    });
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Imprime todas las activities en la base de datos
   */
  static async printActivities(dataSource: DataSource, label = 'ACTIVITIES') {
    const activityRepository = dataSource.getRepository(Activity);
    const activities = await activityRepository.find({ 
      relations: ['workOrder', 'workOrder.assignedTo', 'workOrder.plots', 'workOrder.plots.field'],
      withDeleted: true
    });
    
    const output = [`\n========== ${label} (${activities.length}) ==========`];
    activities.forEach(activity => {
      output.push(`- Activity [ID: ${activity.id}]\n  Type: ${activity.type}\n  Status: ${activity.status}${activity.deletedAt ? ' (DELETED)' : ''}\n  Work Order: ${activity.workOrder?.title || 'N/A'}\n  Assigned To: ${activity.workOrder?.assignedTo?.name || 'N/A'}\n  Hours Worked: ${activity.hoursWorked}\n  Execution Date: ${activity.executionDate.toISOString().split('T')[0]}`);
    });
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Imprime un resumen completo de todos los datos
   */
  static async printFullSnapshot(dataSource: DataSource, label = 'DATABASE SNAPSHOT') {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${label}`);
    console.log('='.repeat(70));
    
    await this.printUsers(dataSource, 'USERS');
    await this.printFields(dataSource, 'FIELDS');
    await this.printPlots(dataSource, 'PLOTS');
    await this.printWorkOrders(dataSource, 'WORK ORDERS');
    await this.printActivities(dataSource, 'ACTIVITIES');
    
    console.log('='.repeat(70) + '\n');
  }

  /**
   * Imprime información específica de un usuario y sus permisos
   */
  static async printUserPermissions(dataSource: DataSource, userId: string, userName: string) {
    const userRepository = dataSource.getRepository(User);
    const fieldRepository = dataSource.getRepository(Field);
    const workOrderRepository = dataSource.getRepository(WorkOrder);
    
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['managedFields']
    });

    if (!user) {
      console.log(`\n❌ Usuario no encontrado: ${userId}`);
      return;
    }

    const output = [
      `\n========== USER PERMISSIONS: ${userName} ==========`,
      `ID: ${user.id}`,
      `Role: ${user.role}`,
      `Email: ${user.email}`
    ];
    
    if (user.role === 'CAPATAZ') {
      const managedFields = await fieldRepository.find({
        where: { managerId: userId },
        relations: ['plots']
      });
      
      output.push(`\nManaged Fields (${managedFields.length}):`);
      managedFields.forEach(field => {
        output.push(`  - ${field.name} [ID: ${field.id}]  Plots: ${field.plots?.length || 0}`);
      });
      
      const managedFieldIds = managedFields.map(f => f.id);
      
      // Si no hay campos gestionados, no hacer la query (evita SQL error con IN ())
      let accessibleWorkOrders: any[] = [];
      if (managedFieldIds.length > 0) {
        accessibleWorkOrders = await workOrderRepository
          .createQueryBuilder('wo')
          .leftJoinAndSelect('wo.plots', 'plot')
          .leftJoinAndSelect('plot.field', 'field')
          .where('field.id IN (:...fieldIds)', { fieldIds: managedFieldIds })
          .getMany();
      }
      
      output.push(`\nAccessible Work Orders: ${accessibleWorkOrders.length}`);
    } else if (user.role === 'OPERARIO') {
      const assignedWorkOrders = await workOrderRepository.find({
        where: { assignedToId: userId }
      });
      
      output.push(`\nAssigned Work Orders: ${assignedWorkOrders.length}`);
      assignedWorkOrders.forEach(wo => {
        output.push(`  - ${wo.title} [ID: ${wo.id}]`);
      });
    }
    
    output.push('='.repeat(50) + '\n');
    console.log(output.join('\n'));
  }

  /**
   * Cuenta todos los registros por entidad
   */
  static async printRecordCounts(dataSource: DataSource) {
    const userRepository = dataSource.getRepository(User);
    const fieldRepository = dataSource.getRepository(Field);
    const plotRepository = dataSource.getRepository(Plot);
    const workOrderRepository = dataSource.getRepository(WorkOrder);
    const activityRepository = dataSource.getRepository(Activity);

    const output = [
      '\n========== RECORD COUNTS ==========',
      `Users: ${await userRepository.count()}`,
      `Fields: ${await fieldRepository.count()}`,
      `Plots: ${await plotRepository.count()}`,
      `Work Orders: ${await workOrderRepository.count()}`,
      `Activities: ${await activityRepository.count()}`,
      '='.repeat(40) + '\n'
    ];
    console.log(output.join('\n'));
  }
}
