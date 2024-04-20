import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  DELETE_SUCCESS,
  SAVING_SUCCESS,
  UPDATE_SUCCESS,
} from "src/common/constant/api-response.constant";
import { PaginationParamsDto } from "src/core/dto/pagination-params.dto";
import { ReminderDto } from "src/core/dto/reminder/reminder.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { ReminderService } from "src/services/reminder.service";

@ApiTags("reminder")
@Controller("reminder")
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}
}
