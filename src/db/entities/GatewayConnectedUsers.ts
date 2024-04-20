import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./Users";

@Index("pk_gatewayconnectedusers_933578364", ["id"], { unique: true })
@Entity("GatewayConnectedUsers", { schema: "dbo" })
export class GatewayConnectedUsers {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: string;

  @Column("character varying", { name: "SocketId", length: 100 })
  socketId: string;

  @ManyToOne(() => Users, (users) => users.gatewayConnectedUsers)
  @JoinColumn([{ name: "UserId", referencedColumnName: "userId" }])
  user: Users;
}
