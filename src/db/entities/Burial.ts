import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Lot } from "./Lot";
import { Reservation } from "./Reservation";
import { WorkOrder } from "./WorkOrder";

@Index("Burial_pkey", ["burialId"], { unique: true })
@Entity("Burial", { schema: "dbo" })
export class Burial {
  @PrimaryGeneratedColumn({ type: "bigint", name: "BurialId" })
  burialId: string;

  @Column("character varying", { name: "BurialCode", nullable: true })
  burialCode: string | null;

  @Column("character varying", { name: "FullName" })
  fullName: string;

  @Column("date", { name: "DateOfBirth" })
  dateOfBirth: string;

  @Column("date", { name: "DateOfDeath" })
  dateOfDeath: string;

  @Column("date", { name: "DateOfBurial" })
  dateOfBurial: string;

  @Column("character varying", { name: "FamilyContactPerson" })
  familyContactPerson: string;

  @Column("character varying", { name: "FamilyContactNumber" })
  familyContactNumber: string;

  @Column("boolean", { name: "FromReservation", default: () => "false" })
  fromReservation: boolean;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @ManyToOne(() => Lot, (lot) => lot.burials)
  @JoinColumn([{ name: "LotId", referencedColumnName: "lotId" }])
  lot: Lot;

  @ManyToOne(() => Reservation, (reservation) => reservation.burials)
  @JoinColumn([
    { name: "ReservationId", referencedColumnName: "reservationId" },
  ])
  reservation: Reservation;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.burials)
  @JoinColumn([{ name: "WorkOrderId", referencedColumnName: "workOrderId" }])
  workOrder: WorkOrder;
}
