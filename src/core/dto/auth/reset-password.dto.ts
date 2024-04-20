import { IsNotEmpty } from "class-validator";
import { Match } from "../match.decorator.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserResetPasswordDto {

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @Match("password")
  @IsNotEmpty()
  confirmPassword: string;
}
