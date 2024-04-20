/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  Res,
  StreamableFile,
  HttpException,
  HttpStatus,
  Get,
  Param,
  Put,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { BurialService } from "src/services/burial.service";
import createReport from "docx-templates";
import fs from "fs";
import moment from "moment";
import { ConfigService } from "@nestjs/config";
import { getEnvPath } from "src/common/utils/utils";
import path from "path";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import {
  UpdateSettingsDto,
  UploadCertificateTemplateDto,
} from "src/core/dto/settings/settings.dto";
import { SystemConfig } from "src/db/entities/SystemConfig";
import { SettingsService } from "src/services/settings.service";
import e from "express";
import { UPDATE_SUCCESS } from "src/common/constant/api-response.constant";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("")
  //   @UseGuards(JwtAuthGuard)
  async getAll() {
    const res: ApiResponseModel<SystemConfig[]> = {} as any;
    try {
      res.data = await this.settingsService.getAll();
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Get("/:key")
  //   @UseGuards(JwtAuthGuard)
  async find(@Param("key") key: string) {
    const res: ApiResponseModel<SystemConfig> = {} as any;
    try {
      res.data = await this.settingsService.find(key);
      res.success = true;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("")
  //   @UseGuards(JwtAuthGuard)
  async update(@Body() dto: UpdateSettingsDto) {
    const res: ApiResponseModel<SystemConfig> = {} as any;
    try {
      res.data = await this.settingsService.update(dto);
      res.success = true;
      res.message = `Setings ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }

  @Put("uploadCertificateTemplate")
  //   @UseGuards(JwtAuthGuard)
  async uploadCertificateTemplate(@Body() dto: UploadCertificateTemplateDto) {
    const res: ApiResponseModel<SystemConfig> = {} as any;
    try {
      res.data = await this.settingsService.uploadCertificateTemplate(dto);
      res.success = true;
      res.message = `Setings ${UPDATE_SUCCESS}`;
      return res;
    } catch (e) {
      res.success = false;
      res.message = e.message !== undefined ? e.message : e;
      return res;
    }
  }
}
