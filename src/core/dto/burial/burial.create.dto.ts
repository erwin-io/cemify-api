import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsUppercase } from "class-validator";
import { DefaultBurialDto } from "./burial-base.dto";

export class CreateBurialDto extends DefaultBurialDto {
  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Lot is required!"
  })
  lotCode: string;
}
export class CreateBurialFromReservationDto {
  @ApiProperty()
  @IsNotEmpty()
  reservationCode: string;

  @ApiProperty()
  @IsNotEmpty({
    message: "Not allowed, Assigned user is required!"
  })
  assignedStaffUserId: string;
}
