import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GatewayConnectedUsers } from "./GatewayConnectedUsers";
import { Notifications } from "./Notifications";
import { Reservation } from "./Reservation";
import { UserOneSignalSubscription } from "./UserOneSignalSubscription";
import { UserProfilePic } from "./UserProfilePic";
import { Access } from "./Access";
import { WorkOrder } from "./WorkOrder";

@Index("u_user_number", ["active", "mobileNumber"], { unique: true })
@Index("u_username", ["active", "userName"], { unique: true })
@Index("pk_users_1557580587", ["userId"], { unique: true })
@Entity("Users", { schema: "dbo" })
export class Users {
  @PrimaryGeneratedColumn({ type: "bigint", name: "UserId" })
  userId: string;

  @Column("character varying", { name: "UserName" })
  userName: string;

  @Column("character varying", { name: "Password" })
  password: string;

  @Column("character varying", { name: "FullName" })
  fullName: string;

  @Column("character varying", { name: "MobileNumber" })
  mobileNumber: string;

  @Column("boolean", { name: "AccessGranted" })
  accessGranted: boolean;

  @Column("boolean", { name: "Active", default: () => "true" })
  active: boolean;

  @Column("character varying", { name: "UserCode", nullable: true })
  userCode: string | null;

  @Column("character varying", { name: "UserType" })
  userType: string;

  @OneToMany(
    () => GatewayConnectedUsers,
    (gatewayConnectedUsers) => gatewayConnectedUsers.user
  )
  gatewayConnectedUsers: GatewayConnectedUsers[];

  @OneToMany(() => Notifications, (notifications) => notifications.user)
  notifications: Notifications[];

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  @OneToMany(
    () => UserOneSignalSubscription,
    (userOneSignalSubscription) => userOneSignalSubscription.user
  )
  userOneSignalSubscriptions: UserOneSignalSubscription[];

  @OneToOne(() => UserProfilePic, (userProfilePic) => userProfilePic.user)
  userProfilePic: UserProfilePic;

  @ManyToOne(() => Access, (access) => access.users)
  @JoinColumn([{ name: "AccessId", referencedColumnName: "accessId" }])
  access: Access;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.assignedStaffUser)
  workOrders: WorkOrder[];
}
