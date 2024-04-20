import { Module } from "@nestjs/common";
import { AccessController } from "./access.controller";
import { Access } from "src/db/entities/Access";
import { AccessService } from "src/services/access.service";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Access])],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
