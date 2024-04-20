import { Module } from "@nestjs/common";
import { ReminderController } from "./reminder.controller";
import { ReminderService } from "src/services/reminder.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PusherService } from "src/services/pusher.service";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { HttpModule } from "@nestjs/axios";
import { Notifications } from "src/db/entities/Notifications";

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Notifications])],
  controllers: [ReminderController],
  providers: [ReminderService, PusherService, OneSignalNotificationService],
  exports: [ReminderService, PusherService, OneSignalNotificationService],
})
export class ReminderModule {}
