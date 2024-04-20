import { LocalAuthGuard } from "../../core/auth/local.auth.guard";
import {
  Controller,
  Body,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
  Headers,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "../../services/auth.service";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { LogInDto } from "src/core/dto/auth/login.dto";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { REGISTER_SUCCESS } from "src/common/constant/api-response.constant";
import { Users } from "src/db/entities/Users";
import { RegisterClientUserDto } from "src/core/dto/auth/register.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register/client")
  public async registerClient(@Body() createUserDto: RegisterClientUserDto) {
    const res: ApiResponseModel<Users> = {} as any;
    try {
      res.data = await this.authService.registerClient(createUserDto);
      res.success = true;
      res.message = `${REGISTER_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("login/staff")
  public async loginStaff(@Body() loginUserDto: LogInDto) {
    const res: ApiResponseModel<Users> = {} as ApiResponseModel<Users>;
    try {
      res.data = await this.authService.getStaffByCredentials(loginUserDto);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("login/client")
  public async loginClient(@Body() loginUserDto: LogInDto) {
    const res: ApiResponseModel<Users> = {} as ApiResponseModel<Users>;
    try {
      res.data = await this.authService.getClientByCredentials(loginUserDto);
      res.success = true;
      return res;
    } catch (e) {
      throw new HttpException(
        e.message !== undefined ? e.message : e,
        HttpStatus.BAD_REQUEST);
    }
  }
}
