import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsIn, IsUppercase } from "class-validator";
import { DefaultReservationDto } from "./reservation-base.dto";

export class UpdateReservationDto extends DefaultReservationDto {}

export class UpdateReservationStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn(["REJECTED", "APPROVED", "LEASED", "CANCELLED"])
  @IsUppercase()
  status: "REJECTED" | "APPROVED" | "LEASED" | "CANCELLED";
}
