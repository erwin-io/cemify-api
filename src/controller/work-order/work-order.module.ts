import { Module } from "@nestjs/common";
import { WorkOrderController } from "./work-order.controller";
import { WorkOrder } from "src/db/entities/WorkOrder";
import { WorkOrderService } from "src/services/work-order.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { PusherService } from "src/services/pusher.service";

@Module({
  imports: [
    FirebaseProviderModule,
    HttpModule,
    TypeOrmModule.forFeature([WorkOrder]),
  ],
  controllers: [WorkOrderController],
  providers: [WorkOrderService, PusherService, OneSignalNotificationService],
  exports: [WorkOrderService, PusherService, OneSignalNotificationService],
})
export class WorkOrderModule {}
