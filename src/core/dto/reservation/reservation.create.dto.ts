import { Transform } from "class-transformer";
import { DefaultReservationDto } from "./reservation-base.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsNumberString } from "class-validator";

export class CreateReservationDto extends DefaultReservationDto {
  @ApiProperty()
  @IsNotEmpty()
  userCode: string;
  
  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Lot is required!"
  })
  lotCode: string;
}
