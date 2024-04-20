import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Burial } from "./Burial";
import { Users } from "./Users";

@Index("WorkOrder_pkey", ["workOrderId"], { unique: true })
@Entity("WorkOrder", { schema: "dbo" })
export class WorkOrder {
  @PrimaryGeneratedColumn({ type: "bigint", name: "WorkOrderId" })
  workOrderId: string;

  @Column("character varying", { name: "WorkOrderCode", nullable: true })
  workOrderCode: string | null;

  @Column("date", { name: "DateTargetCompletion" })
  dateTargetCompletion: string;

  @Column("character varying", { name: "Title" })
  title: string;

  @Column("character varying", { name: "Description" })
  description: string;

  @Column("character varying", { name: "Status", default: () => "'PENDING'" })
  status: string;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "Type" })
  type: string;

  @OneToMany(() => Burial, (burial) => burial.workOrder)
  burials: Burial[];

  @ManyToOne(() => Users, (users) => users.workOrders)
  @JoinColumn([{ name: "AssignedStaffUserId", referencedColumnName: "userId" }])
  assignedStaffUser: Users;
}
