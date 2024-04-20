import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class ReminderDto {
  @ApiProperty()
  @IsNotEmpty()
  date: Date;
}
