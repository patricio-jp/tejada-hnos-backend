import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plot } from './plot.entity';
import { User } from './user.entity';
import { ActivityType } from '@/enums';
import { ENV } from '@/config/environment';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: ENV.NODE_ENV === 'test' ? 'simple-enum' : 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column('text')
  description: string;
  
  @Column(ENV.NODE_ENV === 'test' ? 'datetime' : 'timestamp')
  executionDate: Date;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Plot)
  plot: Plot;

  @ManyToOne(() => User)
  createdByUser: User;
}
