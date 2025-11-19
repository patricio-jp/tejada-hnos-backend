import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Customer } from './customer.entity';
import { Shipment } from './shipment.entity';
import { SalesOrderDetail } from './sale-order-detail.entity';
import { SalesOrderStatus } from '@/enums';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.PENDIENTE,
  })
  status: SalesOrderStatus;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column('uuid')
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.salesOrders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => SalesOrderDetail, detail => detail.salesOrder, { onDelete: 'CASCADE' })
  details: SalesOrderDetail[];

  @OneToMany(() => Shipment, shipment => shipment.salesOrder, { onDelete: 'CASCADE' })
  shipments: Shipment[];
}
