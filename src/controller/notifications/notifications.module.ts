import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { Notifications } from "src/db/entities/Notifications";
import { NotificationsService } from "src/services/notifications.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PusherService } from "src/services/pusher.service";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Notifications])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    PusherService,
    OneSignalNotificationService,
  ],
  exports: [NotificationsService, PusherService, OneSignalNotificationService],
})
export class NotificationsModule {}
