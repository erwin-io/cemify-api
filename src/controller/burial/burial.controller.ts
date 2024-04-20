import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import {
  CreateBurialFromReservationDto,
  CreateBurialDto,
} from "src/core/dto/burial/burial.create.dto";
import { UpdateBurialDto } from "src/core/dto/burial/burial.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Burial } from "src/db/entities/Burial";
import { Lot } from "src/db/entities/Lot";
import { BurialService } from "src/services/burial.service";

@ApiTags("burial")
@Controller("burial")
export class BurialController {
  constructor(private readonly burialService: BurialService) {}

  @Get("/searchMap/:key")
  async searcMap(@Param("key") key: string) {
    const res = {} as ApiResponseModel<{ lot: Lot[]; burial: Burial[] }>;
    try {
      res.data = await this.burialService.searchMap(key);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/getAllByClientUserCode/:userCode")
  async getAllByClientUserCode(@Param("userCode") userCode: string) {
    const res = {} as ApiResponseModel<any[]>;
    try {
      res.data = await this.burialService.getAllByClientUserCode(userCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/generateReport")
  //   @UseGuards(JwtAuthGuard)
  async generateReport() {
    const res = {} as ApiResponseModel<Burial[]>;
    try {
      res.data = await this.burialService.getAll();
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/:burialCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("burialCode") burialCode: string) {
    const res = {} as ApiResponseModel<Burial>;
    try {
      res.data = await this.burialService.getByCode(burialCode);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/page")
  //   @UseGuards(JwtAuthGuard)
  async getPaginated(@Body() params: PaginationParamsDto) {
    const res: ApiResponseModel<{
      results: Burial[];
      total: number;
    }> = {} as any;
    try {
      res.data = await this.burialService.getPagination(params);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("")
  //   @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateBurialDto) {
    const res: ApiResponseModel<Burial> = {} as any;
    try {
      res.data = await this.burialService.create(dto);
      res.success = true;
      res.message = `Burial ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Post("/createFromReservation")
  //   @UseGuards(JwtAuthGuard)
  async createFromReservation(@Body() dto: CreateBurialFromReservationDto) {
    const res: ApiResponseModel<Burial> = {} as any;
    try {
      res.data = await this.burialService.createFromReservation(dto);
      res.success = true;
      res.message = `Burial ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:burialCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("burialCode") burialCode: string,
    @Body() dto: UpdateBurialDto
  ) {
    const res: ApiResponseModel<Burial> = {} as any;
    try {
      res.data = await this.burialService.update(burialCode, dto);
      res.success = true;
      res.message = `Burial ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Delete("/:burialCode")
  //   @UseGuards(JwtAuthGuard)
  async delete(@Param("burialCode") burialCode: string) {
    const res: ApiResponseModel<Burial> = {} as any;
    try {
      res.data = await this.burialService.delete(burialCode);
      res.success = true;
      res.message = `Burial ${DELETE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
