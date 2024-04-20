import { type } from "os";
import { Notifications } from "src/db/entities/Notifications";
import { Reservation } from "src/db/entities/Reservation";
import { Burial } from "src/db/entities/Burial";
import { Users } from "src/db/entities/Users";
import {
  EntityManager,
  ILike,
  LessThan,
  LessThanOrEqual,
  Repository,
} from "typeorm";
import { PusherService } from "./pusher.service";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment";
import { DateConstant } from "src/common/constant/date.constant";
import {
  NOTIF_TITLE,
  NOTIF_TYPE,
} from "src/common/constant/notifications.constant";
import {
  getNextMonth,
  getNextWeek,
  getNextDate,
  CONST_QUERYCURRENT_TIMESTAMP,
} from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import {
  CreateBurialDto,
  CreateBurialFromReservationDto,
} from "src/core/dto/burial/burial.create.dto";
import { UpdateBurialDto } from "src/core/dto/burial/burial.update.dto";
import { BURIAL_ERROR_NOT_FOUND } from "src/common/constant/burial.constant";
import {
  RESERVATION_ERROR_NOT_FOUND,
  RESERVATION_STATUS,
} from "src/common/constant/reservation.constant";
import {
  LOT_ERROR_NOT_AVAILABLE,
  LOT_ERROR_NOT_FOUND,
  LOT_ERROR_OCCUPIED,
  LOT_STATUS,
} from "src/common/constant/lot.constant";
import { Lot } from "src/db/entities/Lot";
import { WorkOrder } from "src/db/entities/WorkOrder";
import { WORK_ORDER_TYPE } from "src/common/constant/work-order.constant";

@Injectable()
export class BurialService {
  constructor(
    @InjectRepository(Burial)
    private readonly burialRepo: Repository<Burial>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async getAll() {
    return this.burialRepo.find({
      where: {
        active: true,
      },
      relations: {
        lot: true,
      },
    });
  }

  async searchMap(key) {
    const [burial, lot] = await Promise.all([
      this.burialRepo.manager.query(`
      select 
      b."BurialId" as "burialId", 
      b."BurialCode" as "burialCode", 
      b."FullName" as "fullName", 
      b."DateOfBirth" as "dateOfBirth", 
      b."DateOfDeath" as "dateOfDeath", 
      b."DateOfBurial" as "dateOfBurial", 
      b."FamilyContactPerson" as "familyContactPerson", 
      b."FamilyContactNumber" as "familyContactNumber", 
      b."FromReservation" as "fromReservation", 
      b."Active" as "burialId", 
      b."LotId" as "lotId",  
      l."LotCode" as "lotCode",  
      l."Block" as "block",  
      l."Level" as "level",  
      l."MapData" as "mapData",  
      l."Status" as "status" FROM dbo."Burial" b
    left join dbo."Lot" l ON b."LotId" = l."LotId"
    where LOWER(b."FullName") like '%${key.toLowerCase()}%' and b."Active" = true 
      `),
      this.burialRepo.manager.query(`
      select 
      "LotId" as "lotId",  
      "LotCode" as "lotCode",  
      "Block" as "block",  
      "Level" as "level",  
      "MapData" as "mapData",  
      "Status" as "status" FROM dbo."Lot" where LOWER("LotCode") like '%${key.toLowerCase()}%' `),
    ]);
    return {
      burial: burial.map((res) => {
        return {
          burialId: res.burialId,
          burialCode: res.burialCode,
          fullName: res.fullName,
          dateOfBirth: res.dateOfBirth,
          dateOfDeath: res.dateOfDeath,
          dateOfBurial: res.dateOfBurial,
          familyContactPerson: res.familyContactPerson,
          familyContactNumber: res.familyContactNumber,
          fromReservation: res.fromReservation,
          active: res.active,
          lot: {
            lotId: res.lotId,
            lotCode: res.lotCode,
            block: res.block,
            level: res.level,
            mapData: res.mapData,
            status: res.status,
          },
        } as Burial;
      }),
      lot: lot as Lot[],
    };
  }

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.burialRepo.find({
        where: condition,
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: true,
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
        skip,
        take,
        order,
      }),
      this.burialRepo.count({
        where: condition,
      }),
    ]);
    return {
      results: results.map((x) => {
        delete x?.reservation?.user.password;
        return x;
      }),
      total,
    };
  }

  async getByCode(burialCode) {
    const result = await this.burialRepo.findOne({
      where: {
        burialCode,
      },
      relations: {
        lot: true,
        reservation: {
          user: {
            userProfilePic: true,
          },
        },
        workOrder: {
          assignedStaffUser: {
            userProfilePic: true,
          },
        },
      },
    });
    if (!result) {
      throw Error(BURIAL_ERROR_NOT_FOUND);
    }
    delete result?.reservation?.user.password;
    return result;
  }

  async getAllByClientUserCode(userCode) {
    const result = await this.burialRepo.find({
      where: {
        reservation: {
          user: userCode,
          status: RESERVATION_STATUS.LEASED,
        },
      },
      relations: {
        lot: true,
        reservation: {
          user: {
            userProfilePic: {
              file: true,
            },
          },
        },
      },
      order: {
        dateOfBirth: "ASC",
      },
    });
    const contract: any[] = result.map((x) => {
      delete x?.reservation?.user.password;
      return x;
    });
    return contract;
  }

  async create(dto: CreateBurialDto) {
    return await this.burialRepo.manager.transaction(async (entityManager) => {
      let lot = await entityManager.findOne(Lot, {
        where: {
          lotCode: dto.lotCode,
        },
      });
      if (!lot) {
        throw Error(LOT_ERROR_NOT_FOUND);
      }
      if (lot && lot.status === LOT_STATUS.OCCUPIED) {
        throw Error(LOT_ERROR_OCCUPIED);
      }
      if (lot && lot.status === LOT_STATUS.UNAVAILABLE) {
        throw Error(LOT_ERROR_NOT_AVAILABLE);
      }
      let burial = new Burial();

      burial.fullName = dto.fullName;
      const dateOfBirth = moment(
        new Date(dto.dateOfBirth),
        DateConstant.DATE_LANGUAGE
      ).format();
      burial.dateOfBirth = dateOfBirth as any;
      const dateOfDeath = moment(
        new Date(dto.dateOfDeath),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      burial.dateOfDeath = dateOfDeath;
      const dateOfBurial = moment(
        new Date(dto.dateOfBurial),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      burial.dateOfBurial = dateOfBurial;
      burial.familyContactPerson = dto.familyContactPerson;
      burial.familyContactNumber = dto.familyContactNumber;
      burial.fromReservation = false;
      burial.lot = lot;

      let workOrder = new WorkOrder();
      workOrder.type = WORK_ORDER_TYPE.BURIAL;
      workOrder.dateTargetCompletion = dateOfBurial;
      workOrder.title = `Burial work order on ${moment(dateOfBurial).format(
        "MMM DD, YYYY"
      )}`;
      workOrder.description =
        "Date of Burial: " + moment(dateOfBurial).format("MMM DD, YYYY") + "\n";
      "Location\n" +
        "Block: " +
        lot.block +
        " \n" +
        "Lot: " +
        lot.lotCode +
        " \n";
      const assignedStaffUser = await entityManager.findOne(Users, {
        where: {
          userId: dto.assignedStaffUserId,
          userType: USER_TYPE.STAFF,
        },
      });
      workOrder.assignedStaffUser = assignedStaffUser;
      workOrder = await entityManager.save(WorkOrder, workOrder);
      workOrder.workOrderCode = generateIndentityCode(workOrder.workOrderId);
      workOrder = await entityManager.save(WorkOrder, workOrder);
      burial.workOrder = workOrder;

      burial = await entityManager.save(Burial, burial);
      burial.burialCode = generateIndentityCode(burial.burialId);
      burial = await entityManager.save(Burial, burial);

      const workOrderNotifTitle = `New Burial work order assigned to you!`;
      const workOrderNotifDesc = `Burial work order on ${moment(
        dateOfBurial
      ).format("MMM DD, YYYY")} at block ${lot.block}, lot ${lot.lotCode}`;

      const staffNotificationIds = await this.logNotification(
        [assignedStaffUser],
        "WORK_ORDER",
        workOrder,
        entityManager,
        workOrderNotifTitle,
        workOrderNotifDesc
      );
      await this.syncRealTime([assignedStaffUser.userId], burial);
      const pushNotifResults: { userId: string; success: boolean }[] =
        await Promise.all([
          this.oneSignalNotificationService.sendToExternalUser(
            assignedStaffUser.userName,
            "WORK_ORDER",
            burial.burialCode,
            staffNotificationIds,
            workOrderNotifTitle,
            workOrderNotifDesc
          ),
        ]);
      console.log("Push notif results ", JSON.stringify(pushNotifResults));
      lot.status = LOT_STATUS.OCCUPIED;
      lot = await entityManager.save(Lot, lot);

      burial = await entityManager.findOne(Burial, {
        where: {
          burialCode: burial.burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: true,
          },
        },
      });
      delete burial?.workOrder?.assignedStaffUser?.password;
      delete burial?.reservation?.user?.password;
      return burial;
    });
  }

  async createFromReservation(dto: CreateBurialFromReservationDto) {
    return await this.burialRepo.manager.transaction(async (entityManager) => {
      let reservation = await entityManager.findOne(Reservation, {
        where: {
          reservationCode: dto.reservationCode,
        },
        relations: {
          lot: true,
        },
      });
      if (!reservation) {
        throw Error(RESERVATION_ERROR_NOT_FOUND);
      }
      if (!reservation.lot) {
        throw Error(LOT_ERROR_NOT_FOUND);
      }
      if (reservation.lot && reservation.lot.status === LOT_STATUS.OCCUPIED) {
        throw Error(LOT_ERROR_OCCUPIED);
      }
      if (
        reservation.lot &&
        reservation.lot.status === LOT_STATUS.UNAVAILABLE
      ) {
        throw Error(LOT_ERROR_NOT_AVAILABLE);
      }
      let burial = new Burial();

      burial.fullName = reservation.burialName;
      const dateOfBirth = moment(
        new Date(reservation.dateOfBirth),
        DateConstant.DATE_LANGUAGE
      ).format();
      burial.dateOfBirth = dateOfBirth as any;
      const dateOfDeath = moment(
        new Date(reservation.dateOfDeath),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      burial.dateOfDeath = dateOfDeath;
      const dateOfBurial = moment(
        new Date(reservation.dateOfBurial),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      burial.dateOfBurial = dateOfBurial;
      burial.familyContactPerson = reservation.familyContactPerson;
      burial.familyContactNumber = reservation.familyContactNumber;
      burial.fromReservation = true;
      burial.reservation = reservation;
      reservation.status = RESERVATION_STATUS.LEASED;
      reservation = await entityManager.save(Reservation, reservation);
      burial.lot = reservation.lot;

      let workOrder = new WorkOrder();
      workOrder.type = WORK_ORDER_TYPE.BURIAL;
      workOrder.dateTargetCompletion = dateOfBurial;
      workOrder.title = `Burial work order on ${moment(dateOfBurial).format(
        "MMM DD, YYYY"
      )}`;
      workOrder.description =
        "Date of Burial: " + moment(dateOfBurial).format("MMM DD, YYYY") + "\n";
      "Location\n" +
        "Block: " +
        reservation.lot.block +
        " \n" +
        "Lot: " +
        reservation.lot.lotCode +
        " \n";
      const assignedStaffUser = await entityManager.findOne(Users, {
        where: {
          userId: dto.assignedStaffUserId,
          userType: USER_TYPE.STAFF,
        },
      });
      workOrder.assignedStaffUser = assignedStaffUser;
      workOrder = await entityManager.save(WorkOrder, workOrder);
      workOrder.workOrderCode = generateIndentityCode(workOrder.workOrderId);
      workOrder = await entityManager.save(WorkOrder, workOrder);
      burial.workOrder = workOrder;

      burial = await entityManager.save(Burial, burial);
      burial.burialCode = generateIndentityCode(burial.burialId);
      burial = await entityManager.save(Burial, burial);

      const workOrderNotifTitle = `New Burial work order assigned to you!`;
      const workOrderNotifDesc = `Burial work order on ${moment(
        dateOfBurial
      ).format("MMM DD, YYYY")} at block ${reservation.lot.block}, lot ${
        reservation.lot.lotCode
      }`;
      const staffNotificationIds = await this.logNotification(
        [assignedStaffUser],
        "WORK_ORDER",
        workOrder,
        entityManager,
        workOrderNotifTitle,
        workOrderNotifDesc
      );
      await this.syncRealTime([assignedStaffUser.userId], burial);
      const pushNotifResults: { userId: string; success: boolean }[] =
        await Promise.all([
          this.oneSignalNotificationService.sendToExternalUser(
            assignedStaffUser.userName,
            "WORK_ORDER",
            burial.burialCode,
            staffNotificationIds,
            workOrderNotifTitle,
            workOrderNotifDesc
          ),
        ]);
      console.log("Push notif results ", JSON.stringify(pushNotifResults));
      reservation.lot.status = LOT_STATUS.OCCUPIED;
      reservation.lot = await entityManager.save(Lot, reservation.lot);

      burial = await entityManager.findOne(Burial, {
        where: {
          burialCode: burial.burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });
      delete burial?.workOrder?.assignedStaffUser?.password;
      delete burial?.reservation?.user?.password;
      return burial;
    });
  }

  async update(burialCode, dto: UpdateBurialDto) {
    return await this.burialRepo.manager.transaction(async (entityManager) => {
      let burial = await entityManager.findOne(Burial, {
        where: {
          burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });
      if (!burial) {
        throw Error(BURIAL_ERROR_NOT_FOUND);
      }

      burial.fullName = dto.fullName;
      const dateOfBirth = moment(
        new Date(dto.dateOfBirth),
        DateConstant.DATE_LANGUAGE
      ).format();
      burial.dateOfBirth = dateOfBirth as any;
      const dateOfDeath = moment(
        new Date(dto.dateOfDeath),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      burial.dateOfDeath = dateOfDeath;
      const dateOfBurial = moment(
        new Date(dto.dateOfBurial),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      const currentDateOfBurial = moment(
        new Date(burial.dateOfBurial),
        DateConstant.DATE_LANGUAGE
      ).format("YYYY-MM-DD");
      const dateChanged = currentDateOfBurial !== dateOfBurial;
      burial.dateOfBurial = dateOfBurial;
      burial.familyContactPerson = dto.familyContactPerson;
      burial.familyContactNumber = dto.familyContactNumber;

      const assignedStaffUserChanged =
        burial?.workOrder?.assignedStaffUser?.userId !==
        dto.assignedStaffUserId;
      const oldAssignedStaffUser = burial?.workOrder?.assignedStaffUser;

      burial = await entityManager.save(Burial, burial);
      burial.burialCode = generateIndentityCode(burial.burialId);
      burial = await entityManager.save(Burial, burial);
      burial = await entityManager.findOne(Burial, {
        where: {
          burialCode: burial.burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });

      if (dateChanged && !assignedStaffUserChanged) {
        const workOrderNotifTitle = `Burial work order schedule was moved!`;
        const workOrderNotifDesc = `Burial Burial work order schedule at block ${
          burial.lot.block
        }, lot ${burial.lot.lotCode} was moved on to ${moment(
          dateOfBurial
        ).format("MMM DD, YYYY")} `;

        burial.workOrder.dateTargetCompletion = dateOfBurial;
        burial.workOrder.title = `Burial work order on ${moment(
          dateOfBurial
        ).format("MMM DD, YYYY")}`;
        burial.workOrder.description =
          "Date of Burial: " +
          moment(dateOfBurial).format("MMM DD, YYYY") +
          "\n";
        "Location\n" +
          "Block: " +
          burial.lot.block +
          " \n" +
          "Lot: " +
          burial.lot.lotCode +
          " \n";
        burial.workOrder = await entityManager.save(
          WorkOrder,
          burial.workOrder
        );

        const staffNotificationIds = await this.logNotification(
          [burial.workOrder.assignedStaffUser],
          "WORK_ORDER",
          burial.workOrder,
          entityManager,
          workOrderNotifTitle,
          workOrderNotifDesc
        );
        await this.syncRealTime(
          [burial.workOrder.assignedStaffUser.userId],
          burial
        );
        const pushNotifResults: { userId: string; success: boolean }[] =
          await Promise.all([
            this.oneSignalNotificationService.sendToExternalUser(
              burial.workOrder.assignedStaffUser.userName,
              "WORK_ORDER",
              burial.burialCode,
              staffNotificationIds,
              workOrderNotifTitle,
              workOrderNotifDesc
            ),
          ]);
        console.log("Push notif results ", JSON.stringify(pushNotifResults));
      } else if (assignedStaffUserChanged) {
        const workOrderNotifTitleOld = `Burial work order was no longer assigned to you!`;
        const workOrderNotifDescOld = `Burial work order at block ${burial?.lot?.block}, lot ${burial?.lot?.lotCode} was no longer assigned to you!`;

        const workOrderNotifTitleNew = `New Burial work order assigned to you!`;
        const workOrderNotifDescNew = `Burial work order on ${moment(
          dateOfBurial
        ).format("MMM DD, YYYY")} at block ${burial.lot.block}, lot ${
          burial?.lot?.lotCode
        }`;

        burial.workOrder.dateTargetCompletion = dateOfBurial;
        burial.workOrder.title = `Burial work order on ${moment(
          dateOfBurial
        ).format("MMM DD, YYYY")}`;
        burial.workOrder.description =
          "Date of Burial: " +
          moment(dateOfBurial).format("MMM DD, YYYY") +
          "\n";
        "Location\n" +
          "Block: " +
          burial.lot.block +
          " \n" +
          "Lot: " +
          burial.lot.lotCode +
          " \n";
        const newAssignedStaffUser = await entityManager.findOne(Users, {
          where: {
            userId: dto.assignedStaffUserId,
            userType: USER_TYPE.STAFF,
            active: true,
          },
        });
        if (!newAssignedStaffUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        burial.workOrder.assignedStaffUser = newAssignedStaffUser;
        burial.workOrder = await entityManager.save(
          WorkOrder,
          burial.workOrder
        );

        const oldStaffNotificationIds = await this.logNotification(
          [oldAssignedStaffUser],
          "WORK_ORDER",
          burial.workOrder,
          entityManager,
          workOrderNotifTitleOld,
          workOrderNotifDescOld
        );

        const newStaffNotificationIds = await this.logNotification(
          [burial.workOrder.assignedStaffUser],
          "WORK_ORDER",
          burial.workOrder,
          entityManager,
          workOrderNotifTitleNew,
          workOrderNotifDescNew
        );
        await this.syncRealTime(
          [
            oldAssignedStaffUser?.userId,
            burial.workOrder.assignedStaffUser.userId,
          ],
          burial
        );
        const pushNotifResultsOld: { userId: string; success: boolean }[] =
          await Promise.all([
            this.oneSignalNotificationService.sendToExternalUser(
              oldAssignedStaffUser.userName,
              "WORK_ORDER",
              burial.burialCode,
              newStaffNotificationIds,
              workOrderNotifTitleOld,
              workOrderNotifDescOld
            ),
          ]);
        const pushNotifResultsNew: { userId: string; success: boolean }[] =
          await Promise.all([
            this.oneSignalNotificationService.sendToExternalUser(
              burial.workOrder.assignedStaffUser.userName,
              "WORK_ORDER",
              burial.burialCode,
              oldStaffNotificationIds,
              workOrderNotifTitleOld,
              workOrderNotifDescOld
            ),
          ]);
        console.log(
          "Push notif results ",
          JSON.stringify([...pushNotifResultsOld, ...pushNotifResultsNew])
        );
      }

      burial = await entityManager.findOne(Burial, {
        where: {
          burialCode: burial.burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });
      delete burial?.workOrder?.assignedStaffUser?.password;
      delete burial?.reservation?.user?.password;
      return burial;
    });
  }

  async delete(burialCode) {
    return await this.burialRepo.manager.transaction(async (entityManager) => {
      let burial = await entityManager.findOne(Burial, {
        where: {
          burialCode,
          active: true,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });
      if (!burial) {
        throw Error(BURIAL_ERROR_NOT_FOUND);
      }
      burial.active = false;
      burial = await entityManager.save(Burial, burial);

      burial.lot.status = LOT_STATUS.AVAILABLE;
      burial.lot = await entityManager.save(Lot, burial.lot);

      const workOrderNotifTitle = `Burial work order schedule was canceled!`;
      const workOrderNotifDesc = `Burial Burial work order schedule at block ${burial.lot.block}, lot ${burial.lot.lotCode} was canceled!`;

      burial.active = false;
      burial.workOrder = await entityManager.save(WorkOrder, burial.workOrder);

      const staffNotificationIds = await this.logNotification(
        [burial.workOrder.assignedStaffUser],
        "WORK_ORDER",
        burial.workOrder,
        entityManager,
        workOrderNotifTitle,
        workOrderNotifDesc
      );
      await this.syncRealTime(
        [burial.workOrder.assignedStaffUser.userId],
        burial
      );
      const pushNotifResults: { userId: string; success: boolean }[] =
        await Promise.all([
          this.oneSignalNotificationService.sendToExternalUser(
            burial.workOrder.assignedStaffUser.userName,
            "WORK_ORDER",
            burial.burialCode,
            staffNotificationIds,
            workOrderNotifTitle,
            workOrderNotifDesc
          ),
        ]);
      console.log("Push notif results ", JSON.stringify(pushNotifResults));

      burial = await entityManager.findOne(Burial, {
        where: {
          burialCode: burial.burialCode,
        },
        relations: {
          lot: true,
          reservation: {
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
          workOrder: {
            assignedStaffUser: {
              userProfilePic: true,
            },
          },
        },
      });
      delete burial?.workOrder?.assignedStaffUser?.password;
      delete burial?.reservation?.user?.password;
      return burial;
    });
  }

  async logNotification(
    users: Users[],
    type: "RESERVATION" | "WORK_ORDER",
    data: Burial | WorkOrder,
    entityManager: EntityManager,
    title: string,
    description: string
  ) {
    const notifications: Notifications[] = [];

    for (const user of users) {
      notifications.push({
        title,
        description,
        type,
        referenceId:
          type === "WORK_ORDER"
            ? data["workOrderCode"].toString()
            : data["burialCode"].toString(),
        isRead: false,
        user: user,
      } as Notifications);
    }
    const res: Notifications[] = await entityManager.save(
      Notifications,
      notifications
    );
    const notificationsIds = res.map((x) => x.notificationId);
    await this.pusherService.sendNotif(
      users.map((x) => x.userId),
      title,
      description
    );
    return notificationsIds;
  }

  async syncRealTime(userIds: string[], data: Burial) {
    await this.pusherService.burialChanges(userIds, data);
  }
}
