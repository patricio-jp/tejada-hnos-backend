import { UserRole } from '@/enums';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ENV } from '@/config/environment';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({
    type: ENV.NODE_ENV === 'test' ? 'simple-enum' : 'enum',
    enum: UserRole,
    default: UserRole.OPERARIO,
  })
  role: UserRole;

  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
