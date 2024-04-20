import { Module } from "@nestjs/common";
import { BurialController } from "./burial.controller";
import { Burial } from "src/db/entities/Burial";
import { BurialService } from "src/services/burial.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { OneSignalNotificationService } from "src/services/one-signal-notification.service";
import { PusherService } from "src/services/pusher.service";

@Module({
  imports: [
    FirebaseProviderModule,
    HttpModule,
    TypeOrmModule.forFeature([Burial]),
  ],
  controllers: [BurialController],
  providers: [BurialService, PusherService, OneSignalNotificationService],
  exports: [BurialService, PusherService, OneSignalNotificationService],
})
export class BurialModule {}
