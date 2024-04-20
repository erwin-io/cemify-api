import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import moment from "moment";
import { DateConstant } from "src/common/constant/date.constant";
import {
  NOTIF_TITLE,
  NOTIF_TYPE,
} from "src/common/constant/notifications.constant";
import { CONST_QUERYCURRENT_TIMESTAMP } from "src/common/constant/timestamp.constant";
import { USER_ERROR_USER_NOT_FOUND } from "src/common/constant/user-error.constant";
import { USER_TYPE } from "src/common/constant/user-type.constant";
import {
  columnDefToTypeORMCondition,
  generateIndentityCode,
} from "src/common/utils/utils";
import { CreateReservationDto } from "src/core/dto/reservation/reservation.create.dto";
import {
  UpdateReservationDto,
  UpdateReservationStatusDto,
} from "src/core/dto/reservation/reservation.update.dto";
import { Notifications } from "src/db/entities/Notifications";
import { Reservation } from "src/db/entities/Reservation";
import { Users } from "src/db/entities/Users";
import { Repository, In, EntityManager } from "typeorm";
import { OneSignalNotificationService } from "./one-signal-notification.service";
import {
  RESERVATION_ERROR_NOT_FOUND,
  RESERVATION_STATUS,
} from "src/common/constant/reservation.constant";
import { Burial } from "src/db/entities/Burial";
import {
  LOT_ERROR_NOT_AVAILABLE,
  LOT_ERROR_NOT_FOUND,
  LOT_STATUS,
} from "src/common/constant/lot.constant";
import { Lot } from "src/db/entities/Lot";
import { PusherService } from "./pusher.service";

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private pusherService: PusherService,
    private oneSignalNotificationService: OneSignalNotificationService
  ) {}

  async getPagination({ pageSize, pageIndex, order, columnDef }) {
    const skip =
      Number(pageIndex) > 0 ? Number(pageIndex) * Number(pageSize) : 0;
    const take = Number(pageSize);

    const condition = columnDefToTypeORMCondition(columnDef);
    const [results, total] = await Promise.all([
      this.reservationRepo.find({
        where: {
          ...condition,
        },
        skip,
        take,
        order,
        relations: {
          lot: true,
          user: {
            userProfilePic: {
              file: true,
            },
          },
        },
      }),
      this.reservationRepo.count({
        where: {
          ...condition,
        },
      }),
    ]);
    return {
      results: results.map((res) => {
        delete res.user?.password;
        return {
          ...res,
        };
      }),
      total,
    };
  }

  async getByCode(reservationCode = "") {
    const result = await this.reservationRepo.findOne({
      where: {
        reservationCode: reservationCode?.toString()?.toLowerCase(),
      },
      relations: {
        lot: true,
        user: {
          userProfilePic: {
            file: true,
          },
        },
      },
    });
    if (!result) {
      throw Error(RESERVATION_ERROR_NOT_FOUND);
    }
    delete result.user?.password;
    return result;
  }

  async create(dto: CreateReservationDto) {
    return await this.reservationRepo.manager.transaction(
      async (entityManager) => {
        const lot = await entityManager.findOne(Lot, {
          where: {
            lotCode: dto.lotCode,
          },
        });
        if (!lot) {
          throw Error(LOT_ERROR_NOT_FOUND);
        }
        if (lot && lot.status !== LOT_STATUS.AVAILABLE) {
          throw Error(LOT_ERROR_NOT_AVAILABLE);
        }
        let reservation = await entityManager.findOne(Reservation, {
          where: {
            lot: {
              lotCode: dto.lotCode,
            },
            user: {
              userCode: dto.userCode,
            },
            status: In(["PENDING", "APPROVED"]),
          },
        });
        if (reservation) {
          throw Error(
            "The user has a " +
              reservation.status.toLocaleLowerCase() +
              " reservation for the selected lot."
          );
        } else {
          reservation = new Reservation();
        }
        const timestamp = await entityManager
          .query(CONST_QUERYCURRENT_TIMESTAMP)
          .then((res) => {
            return res[0]["timestamp"];
          });
        reservation.dateTime = timestamp;
        reservation.burialName = dto.burialName;
        const dateOfBirth = moment(
          new Date(dto.dateOfBirth),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfBirth = dateOfBirth;
        const dateOfDeath = moment(
          new Date(dto.dateOfDeath),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfDeath = dateOfDeath;
        const dateOfBurial = moment(
          new Date(dto.dateOfBurial),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfBurial = dateOfBurial;
        reservation.familyContactPerson = dto.familyContactPerson;
        reservation.familyContactNumber = dto.familyContactNumber;

        const user = await entityManager.findOne(Users, {
          where: {
            userCode: dto.userCode,
            userType: USER_TYPE.CLIENT,
          },
        });
        if (!user) {
          throw Error(USER_ERROR_USER_NOT_FOUND);
        }
        reservation.user = user;
        reservation.lot = lot;
        reservation.status = RESERVATION_STATUS.PENDING;
        reservation = await entityManager.save(reservation);
        reservation.reservationCode = generateIndentityCode(
          reservation.reservationId
        );
        reservation = await entityManager.save(reservation);
        return await entityManager.findOne(Reservation, {
          where: {
            reservationCode: reservation.reservationCode,
          },
          relations: {
            lot: true,
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
      }
    );
  }

  async update(reservationCode, dto: UpdateReservationDto) {
    return await this.reservationRepo.manager.transaction(
      async (entityManager) => {
        const reservation = await entityManager.findOne(Reservation, {
          where: {
            reservationCode,
          },
          relations: {
            lot: true,
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        if (!reservation) {
          throw Error(RESERVATION_ERROR_NOT_FOUND);
        }

        if (reservation.status !== RESERVATION_STATUS.PENDING) {
          throw Error(
            "The booking was already: " + reservation.status.toLocaleLowerCase()
          );
        }

        reservation.burialName = dto.burialName;
        const dateOfBirth = moment(
          new Date(dto.dateOfBirth),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfBirth = dateOfBirth;
        const dateOfDeath = moment(
          new Date(dto.dateOfDeath),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfDeath = dateOfDeath;
        const dateOfBurial = moment(
          new Date(dto.dateOfBurial),
          DateConstant.DATE_LANGUAGE
        ).format("YYYY-MM-DD");
        reservation.dateOfBurial = dateOfBurial;

        return await entityManager.findOne(Reservation, {
          where: {
            reservationCode: reservation.reservationCode,
          },
          relations: {
            lot: true,
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
      }
    );
  }

  async updateStatus(reservationCode, dto: UpdateReservationStatusDto) {
    return await this.reservationRepo.manager.transaction(
      async (entityManager) => {
        const reservation = await entityManager.findOne(Reservation, {
          where: {
            reservationCode,
          },
          relations: {
            lot: true,
            user: {
              userProfilePic: {
                file: true,
              },
            },
          },
        });
        if (!reservation) {
          throw Error(RESERVATION_ERROR_NOT_FOUND);
        }
        if (reservation.status !== RESERVATION_STATUS.PENDING) {
          throw Error(
            "The booking was already: " + reservation.status.toLocaleLowerCase()
          );
        }
        reservation.status = dto.status;

        let title;
        let desc;
        const status = reservation.status;
        if (status === RESERVATION_STATUS.APPROVED) {
          title = NOTIF_TITLE.RESERVATION_APPROVED;
          desc = `Your reservation for block ${reservation?.lot?.block} - lot ${reservation?.lot?.lotCode} has now been Approved!`;
        } else if (status === RESERVATION_STATUS.APPROVED) {
          title = NOTIF_TITLE.RESERVATION_APPROVED;
          desc = `Your reservation for block ${reservation?.lot?.block} - lot ${reservation?.lot?.lotCode} has now been officially Leased to you!`;
        } else if (status === RESERVATION_STATUS.REJECTED) {
          title = NOTIF_TITLE.RESERVATION_REJECTED;
          desc = `Your reservation for block ${reservation?.lot?.block} - lot ${reservation?.lot?.lotCode} was Rejected!`;
        } else {
          title = `Your reservation was ${
            status.toLowerCase().charAt(0).toUpperCase() + status.slice(1)
          }`;
          desc = `Your reservation for block ${reservation?.lot?.block} - lot ${
            reservation?.lot?.lotCode
          } was now being ${
            status.toLowerCase().charAt(0).toUpperCase() + status.slice(1)
          }!`;
        }
        const notificationIds = await this.logNotification(
          [reservation.user],
          reservation,
          entityManager,
          title,
          desc
        );
        const staffUsers = await entityManager.find(Users, {
          where: { userType: USER_TYPE.STAFF },
        });
        if (status === RESERVATION_STATUS.CANCELLED) {
          await this.syncRealTime(
            [...staffUsers.map((x) => x.userId), reservation.user.userId],
            reservation
          );
        } else {
          await this.syncRealTime([reservation.user.userId], reservation);
        }
        const pushNotifResults: { userId: string; success: boolean }[] =
          await Promise.all([
            this.oneSignalNotificationService.sendToExternalUser(
              reservation.user.userName,
              "RESERVATION",
              reservation.reservationCode,
              notificationIds,
              title,
              desc
            ),
          ]);
        console.log("Push notif results ", JSON.stringify(pushNotifResults));
        return await entityManager.save(Reservation, reservation);
      }
    );
  }

  async logNotification(
    users: Users[],
    data: Reservation,
    entityManager: EntityManager,
    title: string,
    description: string
  ) {
    const notifications: Notifications[] = [];

    for (const user of users) {
      notifications.push({
        title,
        description,
        type: NOTIF_TYPE.RESERVATION.toString(),
        referenceId: data.reservationCode.toString(),
        isRead: false,
        user: user,
      } as Notifications);
    }
    const res: Notifications[] = await entityManager.save(
      Notifications,
      notifications
    );
    const notificationsIds = res.map((x) => x.notificationId);
    await this.pusherService.sendNotif(
      users.map((x) => x.userId),
      title,
      description
    );
    return notificationsIds;
  }

  async syncRealTime(userIds: string[], data: Reservation) {
    await this.pusherService.reservationChanges(userIds, data);
  }
}
