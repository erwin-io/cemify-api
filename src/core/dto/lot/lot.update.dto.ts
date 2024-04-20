import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUppercase,
  ValidateNested,
} from "class-validator";
export class PanMapData {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  x: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  y: string;
}
export class LotMapDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  x: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  y: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  width: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  height: string;

  @ApiProperty()
  @IsOptional()
  transform?: string;

  @ApiProperty({
    required: true,
    isArray: false,
    type: PanMapData,
  })
  @IsNotEmpty()
  @Type(() => PanMapData)
  @ValidateNested()
  pan: PanMapData;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ obj, key }) => {
    return Number(obj[key].toString());
  })
  zoom: string;
}

export class UpdateLotMapDataDto {
  @ApiProperty({
    required: true,
    isArray: false,
    type: LotMapDataDto,
  })
  @IsNotEmpty()
  @Type(() => LotMapDataDto)
  @ValidateNested()
  mapData: LotMapDataDto;
}

export class UpdateLotStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsIn(["AVAILABLE", "UNAVAILABLE"])
  @IsUppercase()
  status: "AVAILABLE" | "UNAVAILABLE";
}

