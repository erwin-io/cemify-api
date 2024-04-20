import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  Matches,
} from "class-validator";
import moment from "moment";

export class DefaultReservationDto {
  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Burial name is required!"
  })
  burialName: string;

  @ApiProperty({
    default: moment().format("YYYY-MM-DD")
  })
  @IsNotEmpty()
  @IsDateString({ strict: true } as any)
  dateOfBirth: Date;

  @ApiProperty({
    default: moment().format("YYYY-MM-DD")
  })
  @IsNotEmpty()
  @IsDateString({ strict: true } as any)
  dateOfDeath: Date;

  @ApiProperty({
    default: moment().format("YYYY-MM-DD")
  })
  @IsNotEmpty()
  @IsDateString({ strict: true } as any)
  dateOfBurial: Date;

  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Family contact person is required!"
  })
  familyContactPerson: string;

  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Family contact number is required!"
  })
  familyContactNumber: string;
  
}
