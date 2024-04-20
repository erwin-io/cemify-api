import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CertificateDto {
  @ApiProperty()
  @IsNotEmpty()
  burialCode: string;
}