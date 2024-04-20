import { Module } from "@nestjs/common";
import { ReservationController } from "./reservation.controller";
import { Reservation } from "src/db/entities/Reservation";
import { ReservationService } from "src/services/reservation.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { PusherService } from "src/services/pusher.service";

@Module({
  imports: [
    FirebaseProviderModule,
    HttpModule,
    TypeOrmModule.forFeature([Reservation]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, PusherService, OneSignalNotificationService],
  exports: [ReservationService, PusherService, OneSignalNotificationService],
})
export class ReservationModule {}
