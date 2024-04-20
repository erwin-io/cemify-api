import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LOT_ERROR_NOT_FOUND } from "src/common/constant/lot.constant";
import { columnDefToTypeORMCondition } from "src/common/utils/utils";
import {
  LotMapDataDto,
  UpdateLotMapDataDto,
  UpdateLotStatusDto,
} from "src/core/dto/lot/lot.update.dto";
import { Burial } from "src/db/entities/Burial";
import { Lot } from "src/db/entities/Lot";
import { Repository } from "typeorm";

@Injectable()
export class LotService {
  constructor(
    @InjectRepository(Lot)
    private readonly lotsRepo: Repository<Lot>
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.lotsRepo.find({
        where: condition,
        skip,
        take,
        order,
      }),
      this.lotsRepo.count({
        where: condition,
      }),
    ]);
    return {
      results,
      total,
    };
  }

  async getByBlock(block) {
    const result = await this.lotsRepo.find({
      where: {
        block,
      },
      relations: {
        burials: true,
      },
    });
    return result;
  }

  async getByCode(lotCode) {
    // const result = await this.lotsRepo.findOne({
    //   where: {
    //     lotCode,
    //   },
    // });
    // if (!result) {
    //   throw Error(LOT_ERROR_NOT_FOUND);
    // }
    // return result;
    const [result] = await this.lotsRepo.query(`
    select 
    l."LotCode" as "lotCode",  
    l."Block" as "block",  
    l."Level" as "level",  
    l."MapData" as "mapData",  
    l."Status" as "status",
    b."BurialId" as "burialId", 
    b."BurialCode" as "burialCode", 
    b."FullName" as "fullName", 
    b."DateOfBirth" as "dateOfBirth", 
    b."DateOfDeath" as "dateOfDeath", 
    b."DateOfBurial" as "dateOfBurial", 
    b."FamilyContactPerson" as "familyContactPerson", 
    b."FamilyContactNumber" as "familyContactNumber", 
    b."FromReservation" as "fromReservation", 
    b."Active" as "burialId", 
    b."LotId" as "lotId" FROM dbo."Lot" l
  left join dbo."Burial" b ON l."LotId" = b."LotId"
  where l."LotCode" = '${lotCode}'`);
    if (!result) {
      throw Error(LOT_ERROR_NOT_FOUND);
    }

    return {
      lotId: result.lotId,
      lotCode: result.lotCode,
      block: result.block,
      level: result.level,
      mapData: result.mapData,
      status: result.status,
      burial: {
        burialId: result.burialId,
        burialCode: result.burialCode,
        fullName: result.fullName,
        dateOfBirth: result.dateOfBirth,
        dateOfDeath: result.dateOfDeath,
        dateOfBurial: result.dateOfBurial,
        familyContactPerson: result.familyContactPerson,
        familyContactNumber: result.familyContactNumber,
        fromReservation: result.fromReservation,
        active: result.active,
      },
    } as any;
  }

  async updateStatus(lotCode, dto: UpdateLotStatusDto) {
    return await this.lotsRepo.manager.transaction(async (entityManager) => {
      const { status } = dto;
      let lot = await entityManager.findOne(Lot, {
        where: {
          lotCode,
        },
      });
      if (!lot) {
        throw Error(LOT_ERROR_NOT_FOUND);
      }
      if (lot.status === status) {
        throw Error("Lot was already " + status.toLowerCase());
      }
      const burial = await entityManager.findOne(Burial, {
        where: {
          active: true,
          lot: {
            lotCode,
          },
        },
      });
      if (burial) {
        throw Error(
          `Cannot update ${status.toLowerCase()} to unavailable, lot was already occupied for burial`
        );
      }
      lot.status = status;
      lot = await entityManager.save(Lot, lot);
      return lot;
    });
  }

  async updateMapData(lotCode, dto: UpdateLotMapDataDto) {
    return await this.lotsRepo.manager.transaction(async (entityManager) => {
      let lot = await entityManager.findOne(Lot, {
        where: {
          lotCode,
        },
      });
      if (!lot) {
        throw Error(LOT_ERROR_NOT_FOUND);
      }
      const currentMapData = lot.mapData as LotMapDataDto;
      currentMapData.pan = dto.mapData.pan;
      currentMapData.zoom = dto.mapData.zoom;
      lot.mapData = currentMapData;
      lot = await entityManager.save(Lot, lot);
      return lot;
    });
  }
}
