import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  Matches,
} from "class-validator";
import moment from "moment";

export class DefaultWorkOrderDto {
  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Title is required!"
  })
  title: string;

  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Description is required!"
  })
  description: string;

  @ApiProperty({
    default: moment().format("YYYY-MM-DD")
  })
  @IsNotEmpty({
    message: "Not allowed, Target date completion is required!"
  })
  @IsDateString({ strict: true } as any)
  dateTargetCompletion: Date;

  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Assigned user is required!"
  })
  assignedStaffUserCode: string;
  
}
