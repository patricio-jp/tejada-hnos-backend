import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, JoinColumn } from "typeorm";
import { Supplier } from "./supplier.entity";
import { GoodsReceipt } from "./goods-receipt.entity";
import { PurchaseOrderDetail } from "./purchase-order-detail.entity";
import { Transform } from "class-transformer";

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  @Transform(({ value }) => parseFloat(value), { toPlainOnly: true })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column('uuid')
  supplierId: string;

  @ManyToOne(() => Supplier, supplier => supplier.purchaseOrders)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @OneToMany(() => PurchaseOrderDetail, detail => detail.purchaseOrder, { cascade: true })
  details: PurchaseOrderDetail[];
  
  @OneToMany(() => GoodsReceipt, receipt => receipt.purchaseOrder)
  receipts: GoodsReceipt[];
}
