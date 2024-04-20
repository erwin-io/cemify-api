import { Module } from "@nestjs/common";
import { LotController } from "./lot.controller";
import { Lot } from "src/db/entities/Lot";
import { LotService } from "src/services/lot.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Lot])],
  controllers: [LotController],
  providers: [LotService],
  exports: [LotService],
})
export class LotModule {}
