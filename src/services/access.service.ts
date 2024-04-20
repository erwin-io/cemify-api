import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ACCESS_ERROR_NOT_FOUND } from "src/common/constant/access.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateAccessDto } from "src/core/dto/access/access.create.dto";
import { UpdateAccessDto } from "src/core/dto/access/access.update.dto";
import { Access } from "src/db/entities/Access";
import { Repository } from "typeorm";

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Access)
    private readonly accessRepo: Repository<Access>
  ) {}

  async getAccessPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.accessRepo.find({
        where: {
          ...condition,
          active: true,
        },
        skip,
        take,
        order,
      }),
      this.accessRepo.count({
        where: {
          ...condition,
          active: true,
        },
      }),
    ]);
    return {
      results,
      total,
    };
  }

  async getByCode(accessCode) {
    const result = await this.accessRepo.findOne({
      select: {
        name: true,
        accessPages: true,
      } as any,
      where: {
        accessCode,
        active: true,
      },
    });
    if (!result) {
      throw Error(ACCESS_ERROR_NOT_FOUND);
    }
    return result;
  }

  async create(dto: CreateAccessDto) {
    return await this.accessRepo.manager.transaction(async (entityManager) => {
      let access = new Access();
      access.name = dto.name;
      access.accessPages = dto.accessPages;
      access = await entityManager.save(access);
      access.accessCode = generateIndentityCode(access.accessId);
      return await entityManager.save(Access, access);
    });
  }

  async update(accessCode, dto: UpdateAccessDto) {
    return await this.accessRepo.manager.transaction(async (entityManager) => {
      const access = await entityManager.findOne(Access, {
        where: {
          accessCode,
          active: true,
        },
      });
      if (!access) {
        throw Error(ACCESS_ERROR_NOT_FOUND);
      }
      access.name = dto.name;
      access.accessPages = dto.accessPages;
      return await entityManager.save(Access, access);
    });
  }

  async delete(accessCode) {
    return await this.accessRepo.manager.transaction(async (entityManager) => {
      const access = await entityManager.findOne(Access, {
        where: {
          accessCode,
          active: true,
        },
      });
      if (!access) {
        throw Error(ACCESS_ERROR_NOT_FOUND);
      }
      access.active = false;
      return await entityManager.save(Access, access);
    });
  }
}
