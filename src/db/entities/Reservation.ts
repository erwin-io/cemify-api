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
import { Lot } from "./Lot";
import { Users } from "./Users";

@Index("Reservation_pkey", ["reservationId"], { unique: true })
@Entity("Reservation", { schema: "dbo" })
export class Reservation {
  @PrimaryGeneratedColumn({ type: "bigint", name: "ReservationId" })
  reservationId: string;

  @Column("character varying", { name: "ReservationCode", nullable: true })
  reservationCode: string | null;

  @Column("timestamp with time zone", { name: "DateTime" })
  dateTime: Date;

  @Column("character varying", { name: "BurialName" })
  burialName: string;

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

  @Column("character varying", { name: "Status", default: () => "'PENDING'" })
  status: string;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @OneToMany(() => Burial, (burial) => burial.reservation)
  burials: Burial[];

  @ManyToOne(() => Lot, (lot) => lot.reservations)
  @JoinColumn([{ name: "LotId", referencedColumnName: "lotId" }])
  lot: Lot;

  @ManyToOne(() => Users, (users) => users.reservations)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
