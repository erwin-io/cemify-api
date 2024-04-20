import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { DefaultAccessDto } from "./access-base.dto";

export class CreateAccessDto extends DefaultAccessDto {
}