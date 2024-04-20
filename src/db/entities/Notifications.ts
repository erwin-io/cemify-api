import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Index("Notifications_pkey", ["notificationId"], { unique: true })
@Entity("Notifications", { schema: "dbo" })
export class Notifications {
  @PrimaryGeneratedColumn({ type: "bigint", name: "NotificationId" })
  notificationId: string;

  @Column("character varying", { name: "Title" })
  title: string;

  @Column("character varying", { name: "Description" })
  description: string;

  @Column("character varying", { name: "Type" })
  type: string;

  @Column("character varying", { name: "ReferenceId" })
  referenceId: string;

  @Column("boolean", { name: "IsRead", default: () => "false" })
  isRead: boolean;

  @Column("timestamp with time zone", {
    name: "Date",
    default: () => "(now() AT TIME ZONE 'Asia/Manila')",
  })
  date: Date;

  @ManyToOne(() => Users, (users) => users.notifications)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
