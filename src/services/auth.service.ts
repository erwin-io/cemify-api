
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../services/users.service";
import { JwtPayload } from "../core/interfaces/payload.interface";
import { JwtService } from "@nestjs/jwt";
import * as fs from "fs";
import * as path from "path";
import {
  compare,
  generateIndentityCode,
  getFullName,
  hash,
} from "src/common/utils/utils";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, In, Repository } from "typeorm";
import moment from "moment";
import { Users } from "src/db/entities/Users";
import { LOGIN_ERROR_PASSWORD_INCORRECT, LOGIN_ERROR_PENDING_ACCESS_REQUEST, LOGIN_ERROR_USER_NOT_FOUND } from "src/common/constant/auth-error.constant";
import { RegisterClientUserDto } from "src/core/dto/auth/register.dto";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
    private readonly jwtService: JwtService,
    private notificationService: NotificationsService,
  ) {}

  async registerClient(dto: RegisterClientUserDto) {
    try {
      return await this.userRepo.manager.transaction(
        async (transactionalEntityManager) => {
          let user = new Users();
          user.userName = dto.mobileNumber;
          user.password = await hash(dto.password);
          user.accessGranted = true;
          user.fullName = dto.fullName;
          user.mobileNumber = dto.mobileNumber;
          user.userType = USER_TYPE.CLIENT.toUpperCase();
          user = await transactionalEntityManager.save(user);
          user.userCode = generateIndentityCode(user.userId);
          user = await transactionalEntityManager.save(Users, user);
          delete user.password;
          return user;
        }
      );
    } catch (ex) {
      if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_user_number")
      ) {
        throw Error("Number already used!");
      } else if (
        ex["message"] &&
        (ex["message"].includes("duplicate key") ||
          ex["message"].includes("violates unique constraint")) &&
        ex["message"].includes("u_username")
      ) {
        throw Error("Username already used!");
      } else {
        throw ex;
      }
    }
  }

  async getByCredentials({userName, password }) {
    try {
      let user = await this.userRepo.findOne({
        where: {
          userName,
          active: true,
        },
        relations: {
          access: true,
          userProfilePic: {
            file: true,
          },
        }
      });
      if (!user) {
        throw Error(LOGIN_ERROR_USER_NOT_FOUND);
      }

      const passwordMatch = await compare(user.password, password);
      if (!passwordMatch) {
        throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
      }
      if (!user.accessGranted) {
        throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
      }
      delete user.password;

      return user;
    } catch(ex) {
      throw ex;
    }
  }

  async getStaffByCredentials({userName, password }) {
    try {
      let user = await this.userRepo.findOne({
        where: {
          userName,
          active: true,
          userType: In([USER_TYPE.ADMIN.toUpperCase(), USER_TYPE.STAFF.toUpperCase()])
        },
        relations: {
          access: true,
          userProfilePic: {
            file: true,
          },
        }
      });
      if (!user) {
        throw Error(LOGIN_ERROR_USER_NOT_FOUND);
      }

      const passwordMatch = await compare(user.password, password);
      if (!passwordMatch) {
        throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
      }
      if (!user.accessGranted) {
        throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
      }
      delete user.password;
      const totalUnreadNotif = await this.notificationService.getUnreadByUser(user.userId)
      return {
        ...user,
        totalUnreadNotif 
      };
    } catch(ex) {
      throw ex;
    }
  }
  
  async getClientByCredentials({userName, password }) {
    try {
      let user = await this.userRepo.findOne({
        where: {
          userName,
          active: true,
          userType: USER_TYPE.CLIENT.toUpperCase()
        },
        relations: {
          userProfilePic: {
            file: true,
          },
        }
      });
      if (!user) {
        throw Error(LOGIN_ERROR_USER_NOT_FOUND);
      }

      const passwordMatch = await compare(user.password, password);
      if (!passwordMatch) {
        throw Error(LOGIN_ERROR_PASSWORD_INCORRECT);
      }
      if (!user.accessGranted) {
        throw Error(LOGIN_ERROR_PENDING_ACCESS_REQUEST);
      }
      delete user.password;
      const totalUnreadNotif = await this.notificationService.getUnreadByUser(user.userId)
      return {
        ...user,
        totalUnreadNotif 
      };
    } catch(ex) {
      throw ex;
    }
  }
}
