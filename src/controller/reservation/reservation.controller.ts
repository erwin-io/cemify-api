import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { CreateReservationDto } from "src/core/dto/reservation/reservation.create.dto";
import {
  UpdateReservationDto,
  UpdateReservationStatusDto,
} from "src/core/dto/reservation/reservation.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { Reservation } from "src/db/entities/Reservation";
import { ReservationService } from "src/services/reservation.service";

@ApiTags("reservation")
@Controller("reservation")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get("/:reservationCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("reservationCode") reservationCode: string) {
    const res = {} as ApiResponseModel<Reservation>;
    try {
      res.data = await this.reservationService.getByCode(reservationCode);
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
      results: Reservation[];
      total: number;
    }> = {} as any;
    try {
      res.data = await this.reservationService.getPagination(params);
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
  async create(@Body() reservationDto: CreateReservationDto) {
    const res: ApiResponseModel<Reservation> = {} as any;
    try {
      res.data = await this.reservationService.create(reservationDto);
      res.success = true;
      res.message = `Reservation ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:reservationCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("reservationCode") reservationCode: string,
    @Body() dto: UpdateReservationDto
  ) {
    const res: ApiResponseModel<Reservation> = {} as any;
    try {
      res.data = await this.reservationService.update(reservationCode, dto);
      res.success = true;
      res.message = `Reservation ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/updateStatus/:reservationCode")
  //   @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param("reservationCode") reservationCode: string,
    @Body() dto: UpdateReservationStatusDto
  ) {
    const res: ApiResponseModel<Reservation> = {} as any;
    try {
      res.data = await this.reservationService.updateStatus(
        reservationCode,
        dto
      );
      res.success = true;
      res.message = `Reservation status ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
