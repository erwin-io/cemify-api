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


export class CreateUserDto extends DefaultUserDto {
  @ApiProperty()
  @Transform(({ obj, key }) => {
    return obj[key].toString();
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ obj, key }) => {
    return obj[key]?.toString();
  })
  accessCode: string;
  
  @ApiProperty()
  @IsNotEmpty()
  @IsIn(["ADMIN", "STAFF"])
  @IsUppercase()
  userType: "ADMIN" | "STAFF";
}