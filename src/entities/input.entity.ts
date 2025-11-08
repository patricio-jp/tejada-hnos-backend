import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';
import { InputUnit } from '../enums';
import { InputUsage } from './input-usage.entity';
import { PurchaseOrderDetail } from './purchase-order-detail.entity';
import { Transform } from 'class-transformer';

@Entity('inputs')
export class Input {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: InputUnit })
  unit: InputUnit;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  stock: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  costPerUnit: number;

  @OneToMany(() => InputUsage, usage => usage.input)
  usages: InputUsage[];

  @OneToMany(() => PurchaseOrderDetail, detail => detail.input)
  purchaseOrderDetails: PurchaseOrderDetail[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
