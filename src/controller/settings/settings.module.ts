import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { BurialService } from "src/services/burial.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Burial } from "src/db/entities/Burial";
import { BurialModule } from "../burial/burial.module";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { SystemConfig } from "src/db/entities/SystemConfig";
import { SettingsService } from "src/services/settings.service";

@Module({
  imports: [FirebaseProviderModule, TypeOrmModule.forFeature([SystemConfig])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
