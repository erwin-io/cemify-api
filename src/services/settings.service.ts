import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { extname } from "path";
import { SETTINGS_ERROR_NOT_FOUND } from "src/common/constant/settings.constant";
import { FirebaseProvider } from "src/core/provider/firebase/firebase-provider";
import { SystemConfig } from "src/db/entities/SystemConfig";
import { Repository } from "typeorm";

@Injectable()
export class SettingsService {
  constructor(
    private firebaseProvoder: FirebaseProvider,
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepo: Repository<SystemConfig>
  ) {}

  getAll() {
    return this.systemConfigRepo.find();
  }

  async update({ key, value }) {
    return await this.systemConfigRepo.manager.transaction(
      async (entityManager) => {
        const systemConfig = await entityManager.findOne(SystemConfig, {
          where: {
            key,
          },
        });

        if (!systemConfig) {
          throw Error(SETTINGS_ERROR_NOT_FOUND);
        }

        systemConfig.value = value;
        return await entityManager.save(SystemConfig, systemConfig);
      }
    );
  }

  find(key) {
    return this.systemConfigRepo.findOneBy({
      key,
    });
  }

  async uploadCertificateTemplate({ fileName, base64 }) {
    return await this.systemConfigRepo.manager.transaction(
      async (entityManager) => {
        let settings = await this.systemConfigRepo.findOneBy({
          key: "CERTIFICATE_TEMPLATE",
        });
        if (!settings) {
          throw new Error(SETTINGS_ERROR_NOT_FOUND);
        }
        if (fileName && base64) {
          const bucket = this.firebaseProvoder.app.storage().bucket();
          if (settings?.key && settings?.key !== "") {
            if (settings.value && settings.value !== "") {
              try {
                const deleteFile = bucket.file(settings.value);
                const exists = await deleteFile.exists();
                if (exists[0]) {
                  deleteFile.delete();
                }
              } catch (ex) {
                console.log(ex);
              }
            }
            settings.value = fileName;

            const bucketFile = bucket.file(settings.value);
            const file = Buffer.from(base64, "base64");
            await bucketFile.save(file).then(async (res) => {
              console.log("res");
              console.log(res);
              await bucketFile.getSignedUrl({
                action: "read",
                expires: "03-09-2500",
              });
              settings = await entityManager.save(SystemConfig, settings);
            });
          }
          return settings;
        }
      }
    );
  }
}
