import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsIn, IsUppercase } from "class-validator";
import { DefaultWorkOrderDto } from "./work-order-base.dto";

export class UpdateWorkOrderDto extends DefaultWorkOrderDto {}

export class UpdateWorkOrderStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn(["COMPLETED", "INPROGRESS", "CANCELLED"])
  @IsUppercase()
  status: "COMPLETED" | "INPROGRESS" | "CANCELLED";
}
