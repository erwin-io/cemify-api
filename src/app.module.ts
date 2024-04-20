import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./db/typeorm/typeorm.service";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./controller/auth/auth.module";
import * as Joi from "@hapi/joi";
import { getEnvPath } from "./common/utils/utils";
import { UsersModule } from "./controller/users/users.module";
import { AccessModule } from "./controller/access/access.module";
import { FirebaseProviderModule } from "./core/provider/firebase/firebase-provider.module";
import { NotificationsModule } from "./controller/notifications/notifications.module";
import { ReminderModule } from "./controller/reminder/reminder.module";
import { BurialModule } from "./controller/burial/burial.module";
import { LotModule } from "./controller/lot/lot.module";
import { ReservationModule } from "./controller/reservation/reservation.module";
import { WorkOrderModule } from "./controller/work-order/work-order.module";
import { CertificateModule } from "./controller/certificate/certificate.module";
import { SettingsModule } from "./controller/settings/settings.module";
const envFilePath: string = getEnvPath(`${__dirname}/common/envs`);

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
      validationSchema: Joi.object({
        UPLOADED_FILES_DESTINATION: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    AuthModule,
    UsersModule,
    AccessModule,
    NotificationsModule,
    FirebaseProviderModule,
    LotModule,
    ReservationModule,
    BurialModule,
    ReminderModule,
    WorkOrderModule,
    CertificateModule,
    SettingsModule
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
