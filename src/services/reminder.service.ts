import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { columnDefToTypeORMCondition } from "src/common/utils/utils";
import { LessThan, Repository } from "typeorm";
import { PusherService } from "./pusher.service";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import { Users } from "src/db/entities/Users";
import { Notifications } from "src/db/entities/Notifications";
import moment from "moment";
import { DateConstant } from "src/common/constant/date.constant";

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Notifications)
    private readonly notificationsRepo: Repository<Notifications>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

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
