import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsIn, IsUppercase } from "class-validator";
import { DefaultBurialDto } from "./burial-base.dto";

export class UpdateBurialDto extends DefaultBurialDto {}