import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Burial } from "./Burial";
import { Reservation } from "./Reservation";

@Index("Lot_LotCode_idx", ["lotCode"], { unique: true })
@Index("Lot_pkey", ["lotId"], { unique: true })
@Entity("Lot", { schema: "dbo" })
export class Lot {
  @PrimaryGeneratedColumn({ type: "bigint", name: "LotId" })
  lotId: string;

  @Column("character varying", { name: "LotCode" })
  lotCode: string;

  @Column("character varying", { name: "Block" })
  block: string;

  @Column("bigint", { name: "Level" })
  level: string;

  @Column("json", { name: "MapData", default: {} })
  mapData: object;

  @Column("character varying", { name: "Status", default: () => "'AVAILABLE'" })
  status: string;

  @OneToMany(() => Burial, (burial) => burial.lot)
  burials: Burial[];

  @OneToMany(() => Reservation, (reservation) => reservation.lot)
  reservations: Reservation[];
}
