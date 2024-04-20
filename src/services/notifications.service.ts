import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { columnDefToTypeORMCondition } from "src/common/utils/utils";
import { Notifications } from "src/db/entities/Notifications";
import { Repository } from "typeorm";
import { PusherService } from "./pusher.service";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { Users } from "src/db/entities/Users";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notifications)
    private readonly notificationsRepo: Repository<Notifications>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.notificationsRepo.find({
        where: condition,
        skip,
        take,
        order,
        relations: {
          user: true,
        },
      }),
      this.notificationsRepo.count({
        where: condition,
      }),
    ]);
    return {
      results,
      total,
    };
  }

  async markAsRead(notificationId: string) {
    return await this.notificationsRepo.manager.transaction(
      async (entityManager) => {
        let notification = await entityManager.findOne(Notifications, {
          where: {
            notificationId,
          },
          relations: {
            user: true,
          },
        });
        notification.isRead = true;
        notification = await entityManager.save(Notifications, notification);
        const totalUnreadNotif = await entityManager.count(Notifications, {
          where: {
            user: {
              userId: notification.user.userId,
              active: true,
            },
            isRead: false,
          },
        });
        return {
          ...notification,
          totalUnreadNotif,
        };
      }
    );
  }

  async getUnreadByUser(userId: string) {
    return this.notificationsRepo.count({
      where: {
        user: {
          userId,
          active: true,
        },
        isRead: false,
      },
    });
  }

  async test({ userId, title, description }) {
    try {
      const user = await this.notificationsRepo.manager.findOne(Users, {
        where: {
          userId,
        },
      });
      this.oneSignalNotificationService.sendToExternalUser(
        user.userName,
        {},
        {},
        [],
        title,
        description
      );
      this.pusherService.sendNotif([userId], title, description);
    } catch (ex) {
      throw ex;
    }
  }
}
