import { Transform } from "class-transformer";
import { DefaultWorkOrderDto } from "./work-order-base.dto";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsNumberString } from "class-validator";

export class CreateWorkOrderDto extends DefaultWorkOrderDto {
}
