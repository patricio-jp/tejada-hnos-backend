import { ActivityType } from "@/enums";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { WorkOrder } from "./work-order.entity";
import { ActivityDetails } from "@/types";
import { InputUsage } from "./input-usage.entity";

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workOrderId: string;

  @ManyToOne(() => WorkOrder, order => order.activities)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Column({ type: 'enum', enum: ActivityType })
  type: ActivityType;

  @Column('timestamp')
  executionDate: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  hoursWorked: number; // Horas-hombre para esta tarea

  @Column({ type: 'jsonb', default: {} })
  details: ActivityDetails;

  @OneToMany(() => InputUsage, usage => usage.activity, { cascade: true })
  inputsUsed: InputUsage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
