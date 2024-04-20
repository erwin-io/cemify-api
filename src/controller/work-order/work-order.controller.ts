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
import { CreateWorkOrderDto } from "src/core/dto/work-order/work-order.create.dto";
import {
  UpdateWorkOrderDto,
  UpdateWorkOrderStatusDto,
} from "src/core/dto/work-order/work-order.update.dto";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { WorkOrder } from "src/db/entities/WorkOrder";
import { WorkOrderService } from "src/services/work-order.service";

@ApiTags("work-order")
@Controller("work-order")
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Get("/:workOrderCode")
  //   @UseGuards(JwtAuthGuard)
  async getDetails(@Param("workOrderCode") workOrderCode: string) {
    const res = {} as ApiResponseModel<WorkOrder>;
    try {
      res.data = await this.workOrderService.getByCode(workOrderCode);
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
      results: WorkOrder[];
      total: number;
    }> = {} as any;
    try {
      res.data = await this.workOrderService.getPagination(params);
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
  async create(@Body() workOrderDto: CreateWorkOrderDto) {
    const res: ApiResponseModel<WorkOrder> = {} as any;
    try {
      res.data = await this.workOrderService.create(workOrderDto);
      res.success = true;
      res.message = `Work Order ${SAVING_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/:workOrderCode")
  //   @UseGuards(JwtAuthGuard)
  async update(
    @Param("workOrderCode") workOrderCode: string,
    @Body() dto: UpdateWorkOrderDto
  ) {
    const res: ApiResponseModel<WorkOrder> = {} as any;
    try {
      res.data = await this.workOrderService.update(workOrderCode, dto);
      res.success = true;
      res.message = `Work Order ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("/updateStatus/:workOrderCode")
  //   @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param("workOrderCode") workOrderCode: string,
    @Body() dto: UpdateWorkOrderStatusDto
  ) {
    const res: ApiResponseModel<WorkOrder> = {} as any;
    try {
      res.data = await this.workOrderService.updateStatus(workOrderCode, dto);
      res.success = true;
      res.message = `Work Order status ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
