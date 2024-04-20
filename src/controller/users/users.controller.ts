import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiParam } from "@nestjs/swagger";
import {
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
  DELETE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { UpdateUserResetPasswordDto } from "src/core/dto/auth/reset-password.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { UpdateProfilePictureDto } from "src/core/dto/user/user-base.dto";
import { CreateUserDto } from "src/core/dto/user/users.create.dto";
import {
  UpdateUserDto,
  UpdateUserProfileDto,
} from "src/core/dto/user/users.update.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Users } from "src/db/entities/Users";
import { UsersService } from "src/services/users.service";

@ApiTags("users")
@Controller("users")
// @ApiBearerAuth("jwt")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get("/:userCode/details")
  //   @UseGuards(JwtAuthGuard)
  async getUserDetailsDetails(@Param("userCode") userCode: string) {
    const res = {} as ApiResponseModel<Users>;
    try {
      res.data = await this.userService.getUserByCode(userCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/page")
  //   @UseGuards(JwtAuthGuard)
  async getUserPagination(@Body() paginationParams: PaginationParamsDto) {
    const res: ApiResponseModel<{ results: Users[]; total: number }> =
      {} as any;
    try {
      res.data = await this.userService.getUserPagination(paginationParams);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/")
  //   @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.create(createUserDto);
      res.success = true;
      res.message = `User  ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/updateProfile/:userCode")
  //   @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Param("userCode") userCode: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto
  ) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.updateProfile(
        userCode,
        updateUserProfileDto
      );
      res.success = true;
      res.message = `User ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:userCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("userCode") userCode: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.update(userCode, updateUserDto);
      res.success = true;
      res.message = `User ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:userCode/resetPassword")
  //   @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Param("userCode") userCode: string,
    @Body() updateUserResetPasswordDto: UpdateUserResetPasswordDto
  ) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.resetPassword(
        userCode,
        updateUserResetPasswordDto
      );
      res.success = true;
      res.message = `User password ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:userCode")
  //   @UseGuards(JwtAuthGuard)
  async deleteUser(@Param("userCode") userCode: string) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.deleteUser(userCode);
      res.success = true;
      res.message = `User ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:userCode/approveAccessRequest")
  //   @UseGuards(JwtAuthGuard)
  async approveAccessRequest(@Param("userCode") userCode: string) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.approveAccessRequest(userCode);
      res.success = true;
      res.message = `User access request ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/updateProfilePicture/:userCode")
  async updateProfilePicture(
    @Param("userCode") userCode: string,
    @Body() dto: UpdateProfilePictureDto
  ) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.userService.updateProfilePicture(userCode, dto);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
