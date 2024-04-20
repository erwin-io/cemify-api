import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNumberString,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
  IsBooleanString,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsUppercase,
  Matches,
} from "class-validator";
import { DefaultUserDto } from "./user-base.dto";


export class UpdateUserDto extends DefaultUserDto {

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  accessCode: string;
}


export class UpdateUserProfileDto extends DefaultUserDto {
  @ApiProperty()
  @IsOptional()
  userProfilePic: any;
}