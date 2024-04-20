import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment";
import { DateConstant } from "src/common/constant/date.constant";
import {
  LOT_ERROR_NOT_FOUND,
  LOT_STATUS,
  LOT_ERROR_NOT_AVAILABLE,
} from "src/common/constant/lot.constant";
import {
  NOTIF_TITLE,
  NOTIF_TYPE,
} from "src/common/constant/notifications.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  WORK_ORDER_ERROR_NOT_FOUND,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
} from "src/common/constant/work-order.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { Lot } from "src/db/entities/Lot";
import { Notifications } from "src/db/entities/Notifications";
import { Users } from "src/db/entities/Users";
import { WorkOrder } from "src/db/entities/WorkOrder";
import { Repository, In, EntityManager } from "typeorm";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { PusherService } from "./pusher.service";
import { CreateWorkOrderDto } from "src/core/dto/work-order/work-order.create.dto";
import {
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
} from "src/core/dto/work-order/work-order.update.dto";

@Injectable()
export class WorkOrderService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.workOrderRepo.find({
        where: {
          ...condition,
        },
        skip,
        take,
        order,
        relations: {
          assignedStaffUser: {
            userProfilePic: {
              file: true,
            },
          },
        },
      }),
      this.workOrderRepo.count({
        where: {
          ...condition,
        },
      }),
    ]);
    return {
      results: results.map((res) => {
        delete res.burials;
        delete res.assignedStaffUser?.password;
        return {
          ...res,
        };
      }),
      total,
    };
  }

  async getByCode(workOrderCode = "") {
    const result = await this.workOrderRepo.findOne({
      where: {
        workOrderCode: workOrderCode?.toString()?.toLowerCase(),
      },
      relations: {
        burials: {
          lot: true,
        },
        assignedStaffUser: {
          userProfilePic: {
            file: true,
          },
        },
      },
    });
    if (!result) {
      throw Error(WORK_ORDER_ERROR_NOT_FOUND);
    }
    delete result.assignedStaffUser?.password;
    return result;
  }

  async create(dto: CreateWorkOrderDto) {
    return await this.workOrderRepo.manager.transaction(
      async (entityManager) => {
        let workOrder = new WorkOrder();
        workOrder.title = dto.title;
        workOrder.description = dto.description;
        const dateTargetCompletion = moment(
          new Date(dto.dateTargetCompletion),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        workOrder.dateTargetCompletion = dateTargetCompletion;
        const assignedStaffUser = await entityManager.findOne(Users, {
          where: {
            userCode: dto.assignedStaffUserCode,
            userType: USER_TYPE.STAFF,
            active: true,
          },
        });
        if (!assignedStaffUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        workOrder.assignedStaffUser = assignedStaffUser;
        workOrder.status = WORK_ORDER_STATUS.PENDING;
        workOrder.type = WORK_ORDER_TYPE.MAINTENANCE;
        workOrder = await entityManager.save(workOrder);
        workOrder.workOrderCode = generateIndentityCode(workOrder.workOrderId);
        workOrder = await entityManager.save(workOrder);

        const title = `New work order assigned to you!`;
        const desc = `New work order on ${moment(dateTargetCompletion).format(
          "MMM DD, YYYY"
        )} was assigned to you`;
        const notificationIds = await this.logNotification(
          [workOrder.assignedStaffUser],
          workOrder,
          entityManager,
          title,
          desc
        );
        await this.syncRealTime(
          [workOrder.assignedStaffUser.userId],
          workOrder
        );
        const pushNotifResults: { userId: string; success: boolean }[] =
          await Promise.all([
            this.oneSignalNotificationService.sendToExternalUser(
              workOrder.assignedStaffUser.userName,
              "WORK_ORDER",
              workOrder.workOrderCode,
              notificationIds,
              title,
              desc
            ),
          ]);
        console.log("Push notif results ", JSON.stringify(pushNotifResults));
        workOrder = await entityManager.findOne(WorkOrder, {
          where: {
            workOrderCode: workOrder.workOrderCode,
          },
          relations: {
            assignedStaffUser: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        delete workOrder?.assignedStaffUser?.password;
        return workOrder;
      }
    );
  }

  async update(workOrderCode, dto: UpdateWorkOrderDto) {
    return await this.workOrderRepo.manager.transaction(
      async (entityManager) => {
        let workOrder = await entityManager.findOne(WorkOrder, {
          where: {
            workOrderCode,
          },
          relations: {
            assignedStaffUser: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        if (!workOrder) {
          throw Error(WORK_ORDER_ERROR_NOT_FOUND);
        }

        if (workOrder.status !== WORK_ORDER_STATUS.PENDING) {
          throw Error(
            "The booking was already: " + workOrder.status.toLocaleLowerCase()
          );
        }
        workOrder.title = dto.title;
        workOrder.description = dto.description;
        const currentDateTargetCompletion = moment(
          new Date(workOrder.dateTargetCompletion),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        const dateTargetCompletion = moment(
          new Date(dto.dateTargetCompletion),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        const dateChanged =
          dateTargetCompletion !== currentDateTargetCompletion;
        workOrder.dateTargetCompletion = dateTargetCompletion;
        const assignedStaffUser = await entityManager.findOne(Users, {
          where: {
            userCode: dto.assignedStaffUserCode,
            userType: USER_TYPE.STAFF,
            active: true,
          },
        });
        if (!assignedStaffUser) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }

        const assignedStaffUserChanged =
          workOrder?.assignedStaffUser?.userCode !== dto.assignedStaffUserCode;
        const oldAssignedStaffUser = workOrder?.assignedStaffUser;
        workOrder.assignedStaffUser = assignedStaffUser;

        if (dateChanged && !assignedStaffUserChanged) {
          const workOrderNotifTitle = `Work order schedule was moved!`;
          const workOrderNotifDesc = `Work order schedule was moved on to ${moment(
            dateTargetCompletion
          ).format("MMM DD, YYYY")} `;

          const staffNotificationIds = await this.logNotification(
            [workOrder.assignedStaffUser],
            workOrder,
            entityManager,
            workOrderNotifTitle,
            workOrderNotifDesc
          );
          await this.syncRealTime(
            [workOrder.assignedStaffUser.userId],
            workOrder
          );
          const pushNotifResults: { userId: string; success: boolean }[] =
            await Promise.all([
              this.oneSignalNotificationService.sendToExternalUser(
                workOrder.assignedStaffUser.userName,
                "WORK_ORDER",
                workOrder.workOrderCode,
                staffNotificationIds,
                workOrderNotifTitle,
                workOrderNotifDesc
              ),
            ]);
          console.log("Push notif results ", JSON.stringify(pushNotifResults));
        } else if (assignedStaffUserChanged) {
          const workOrderNotifTitleOld = `Work order was no longer assigned to you!`;
          const workOrderNotifDescOld = `Work order was no longer assigned to you!`;

          const workOrderNotifTitleNew = `New work order assigned to you!`;
          const workOrderNotifDescNew = `New work order on ${moment(
            dateTargetCompletion
          ).format("MMM DD, YYYY")} was assigned to you`;

          const oldStaffNotificationIds = await this.logNotification(
            [oldAssignedStaffUser],
            workOrder,
            entityManager,
            workOrderNotifTitleOld,
            workOrderNotifDescOld
          );

          const newStaffNotificationIds = await this.logNotification(
            [workOrder.assignedStaffUser],
            workOrder,
            entityManager,
            workOrderNotifTitleNew,
            workOrderNotifDescNew
          );
          await this.syncRealTime(
            [oldAssignedStaffUser?.userId, workOrder.assignedStaffUser.userId],
            workOrder
          );
          const pushNotifResultsOld: { userId: string; success: boolean }[] =
            await Promise.all([
              this.oneSignalNotificationService.sendToExternalUser(
                oldAssignedStaffUser.userName,
                "WORK_ORDER",
                workOrder.workOrderCode,
                newStaffNotificationIds,
                workOrderNotifTitleOld,
                workOrderNotifDescOld
              ),
            ]);
          const pushNotifResultsNew: { userId: string; success: boolean }[] =
            await Promise.all([
              this.oneSignalNotificationService.sendToExternalUser(
                workOrder.assignedStaffUser.userName,
                "WORK_ORDER",
                workOrder.workOrderCode,
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
        workOrder = await entityManager.save(WorkOrder, workOrder);
        workOrder = await entityManager.findOne(WorkOrder, {
          where: {
            workOrderCode: workOrder.workOrderCode,
          },
          relations: {
            assignedStaffUser: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        delete workOrder?.assignedStaffUser?.password;
        return workOrder;
      }
    );
  }

  async updateStatus(workOrderCode, dto: UpdateWorkOrderStatusDto) {
    return await this.workOrderRepo.manager.transaction(
      async (entityManager) => {
        let workOrder = await entityManager.findOne(WorkOrder, {
          where: {
            workOrderCode,
          },
          relations: {
            assignedStaffUser: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        if (!workOrder) {
          throw Error(WORK_ORDER_ERROR_NOT_FOUND);
        }
        if (
          workOrder.status === WORK_ORDER_STATUS.CANCELLED ||
          workOrder.status === WORK_ORDER_STATUS.COMPLETED
        ) {
          throw Error(
            "The work order was already: " +
              workOrder.status.toLocaleLowerCase()
          );
        } else if (
          dto.status !== "COMPLETED" &&
          workOrder.status === WORK_ORDER_STATUS.INPROGRESS
        ) {
          throw Error(
            "The work order was already: " +
              workOrder.status.toLocaleLowerCase()
          );
        }
        workOrder.status = dto.status;
        const status = workOrder.status;
        if (status === WORK_ORDER_STATUS.CANCELLED) {
          const title = NOTIF_TITLE.WORK_ORDER_CANCELLED;
          const desc = `Your work order for #${workOrder.workOrderCode} ${workOrder.title} was cancelled`;
          const notificationIds = await this.logNotification(
            [workOrder.assignedStaffUser],
            workOrder,
            entityManager,
            title,
            desc
          );
          await this.syncRealTime(
            [workOrder.assignedStaffUser.userId],
            workOrder
          );
          const pushNotifResults: { userId: string; success: boolean }[] =
            await Promise.all([
              this.oneSignalNotificationService.sendToExternalUser(
                workOrder.assignedStaffUser.userName,
                "WORK_ORDER",
                workOrder.workOrderCode,
                notificationIds,
                title,
                desc
              ),
            ]);
          console.log("Push notif results ", JSON.stringify(pushNotifResults));
        }
        workOrder = await entityManager.save(WorkOrder, workOrder);
        workOrder = await entityManager.findOne(WorkOrder, {
          where: {
            workOrderCode: workOrder.workOrderCode,
          },
          relations: {
            assignedStaffUser: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        delete workOrder?.assignedStaffUser?.password;
        return workOrder;
      }
    );
  }

  async logNotification(
    users: Users[],
    data: WorkOrder,
    entityManager: EntityManager,
    title: string,
    description: string
  ) {
    const notifications: Notifications[] = [];

    for (const user of users) {
      notifications.push({
        title,
        description,
        type: NOTIF_TYPE.WORK_ORDER.toString(),
        referenceId: data.workOrderCode.toString(),
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

  async syncRealTime(userIds: string[], data: WorkOrder) {
    await this.pusherService.workOrderChanges(userIds, data);
  }
}
