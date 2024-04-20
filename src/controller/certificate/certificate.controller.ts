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
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CertificateDto } from "src/core/dto/certificate/certificate.dto";
import { ApiResponseModel } from "src/core/models/api-response.model";
import { BurialService } from "src/services/burial.service";
import createReport from "docx-templates";
import fs from "fs";
import moment from "moment";
import { ConfigService } from "@nestjs/config";
import { getEnvPath } from "src/common/utils/utils";
import path from "path";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { SettingsService } from "src/services/settings.service";

@ApiTags("certificate")
@Controller("certificate")
export class CertificateController {
  constructor(
    private firebaseProvoder: FirebaseProvider,
    private burialService: BurialService,
    private settingsService: SettingsService,
    private readonly config: ConfigService
  ) {}

  @Get("/:burialCode")
  //   @UseGuards(JwtAuthGuard)
  async download(
    @Res({ passthrough: true }) response,
    @Param("burialCode") burialCode: string,
    @Query("date") date
  ): Promise<StreamableFile> {
    const res: ApiResponseModel<any> = {} as any;
    try {
      if (!date || date === undefined || date === "") {
        date = new Date();
      }
      const burial = await this.burialService.getByCode(burialCode);
      if (!burial) {
        throw new Error("Burial records not found");
      }

      const templateConfig = await this.settingsService.find(
        "CERTIFICATE_TEMPLATE"
      );
      if (!templateConfig) {
        throw new Error("Certificate error: Template path not set!");
      }
      const delimitersConfig = await this.settingsService.find(
        "CERTIFICATE_TEMPLATE_PROPS"
      );
      if (
        !delimitersConfig ||
        !delimitersConfig?.value ||
        delimitersConfig?.value === "" ||
        delimitersConfig?.value.toString().split(",").length === 0 ||
        delimitersConfig?.value.toString().split(",").length > 2
      ) {
        throw new Error("Certificate error: Template delimiters not set!");
      }
      const delimiters = delimitersConfig.value.toString().split(",");

      const templatePath = templateConfig.value;
      console.log(templatePath);

      const bucket = this.firebaseProvoder.app.storage().bucket();
      const file = bucket.file(`${templatePath}`);
      const result = await file.download();

      const generatedDocumentWithDate = await createReport({
        template: result[0],
        data: {
          day: moment(date, "YYYY-MM-DD").format("Do"),
          month: moment(date, "YYYY-MM-DD").format("MMMM"),
          year: moment(date, "YYYY-MM-DD").format("YYYY"),
        },
        cmdDelimiter: ["[[", "]]"],
      });

      const generatedDocument = await createReport({
        template: generatedDocumentWithDate,
        data: {
          fullName: burial?.fullName,
          dateOfDeath: moment(burial?.dateOfDeath).format("MMMM DD, YYYY"),
          dateOfBurial: moment(burial?.dateOfBurial).format("MMMM DD, YYYY"),
          familyContactPerson: burial?.familyContactPerson,
        },
        cmdDelimiter: [delimiters[0], delimiters[1]],
      });

      const buffer = generatedDocument;

      response.setHeader(
        "Content-Type",
        `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
      );

      const fileName =
        templatePath.split(".")[templatePath.split(".").length - 1];
      console.log();
      response.setHeader(
        "Content-Disposition",
        `attachment; filename=${burial.fullName}.${fileName}`
      );
      return new StreamableFile(Buffer.from(buffer));
    } catch (e) {
      // res.success = false;
      // res.message = e.message !== undefined ? e.message : e;
      // return res;
      throw new HttpException(
        e.message !== undefined ? e.message : e,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
