import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsUppercase,
  ValidateNested,
} from "class-validator";
import moment from "moment";

export class UserDto {
  @ApiProperty()
  @IsNotEmpty()
  userId: string;
}

export class DefaultUserDto {
  @ApiProperty()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumberString()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  mobileNumber: string;
}

export class UpdateProfilePictureDto {
  @ApiProperty()
  @IsOptional()
  userProfilePic: any;
}