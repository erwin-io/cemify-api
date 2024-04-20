import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FirebaseProviderModule } from "src/core/provider/firebase/firebase-provider.module";
import { Users } from "src/db/entities/Users";
import { UsersService } from "src/services/users.service";

@Module({
  imports: [FirebaseProviderModule, TypeOrmModule.forFeature([Users])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
