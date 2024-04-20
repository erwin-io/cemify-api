import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateSettingsDto {
  @ApiProperty({
    description: "Key of the settings",
    default: "key"
  })
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: "Value of the settings",
    default: "value"
  })
  @IsNotEmpty()
  value: string;
}

export class UploadCertificateTemplateDto {
  @ApiProperty()
  @IsOptional()
  fileName: any;

  @ApiProperty()
  @IsOptional()
  base64: any;
}