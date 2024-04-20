import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GatewayConnectedUsers } from "src/db/entities/GatewayConnectedUsers";
import { Users } from "src/db/entities/Users";
import { In, Repository } from "typeorm";

@Injectable()
export class GatewayConnectedUsersService {
  constructor(
    @InjectRepository(GatewayConnectedUsers)
    private readonly gatewayConnectedUsersRepo: Repository<GatewayConnectedUsers>
  ) {}
  async findByUserId(userId = "") {
    try {
      if (userId && userId !== undefined) {
        return await this.gatewayConnectedUsersRepo.findOneBy({
          user: { userId },
        });
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  }
  async findByUserIds(userIds: string[]) {
    try {
      if (userIds && userIds !== undefined) {
        const query = await this.gatewayConnectedUsersRepo.manager.query(`
        select MAX(cu."UserId") as "userId", MAX(cu."SocketId") as "socketId", MAX(n."unRead") as "unRead"
        from dbo."GatewayConnectedUsers" cu 
        LEFT JOIN 
        (
          SELECT "UserId", COUNT("NotificationId") as "unRead"
          FROM dbo."Notifications" GROUP BY "UserId"
          ) n ON cu."UserId" = n."UserId"
        WHERE cu."UserId" IN(SELECT UNNEST(STRING_TO_ARRAY('${userIds.toString()}', ',')):: int)
        GROUP BY cu."UserId"`);
        return query as {
          userId: string;
          socketId: string;
          unRead: string;
        }[];
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  }

  async add({ userId = "", socketId = "" }) {
    try {
      if (
        userId &&
        userId !== undefined &&
        socketId &&
        socketId !== undefined
      ) {
        return await this.gatewayConnectedUsersRepo.manager.transaction(
          async (entityManager) => {
            const connectedUser = await entityManager.findOne(
              GatewayConnectedUsers,
              {
                where: { user: { userId } },
                relations: {
                  user: true,
                },
              }
            );
            if (connectedUser) {
              connectedUser.socketId = socketId;
              return await entityManager.save(
                GatewayConnectedUsers,
                connectedUser
              );
            } else {
              const newConnectedUser = new GatewayConnectedUsers();
              newConnectedUser.user = await entityManager.findOne(Users, {
                where: { userId },
              });
              newConnectedUser.socketId = socketId;
              return await entityManager.save(
                GatewayConnectedUsers,
                newConnectedUser
              );
            }
          }
        );
      } else {
        return null;
      }
    } catch (e) {
      throw e;
    }
  }

  async deleteByUserId(userId = "") {
    try {
      if (!userId || userId === undefined || userId === "undefined") {
        return null;
      }
      return await this.gatewayConnectedUsersRepo.manager.transaction(
        async (entityManager) => {
          const gatewayConnectedUsers = await entityManager.find(
            GatewayConnectedUsers,
            {
              where: { user: { userId } },
            }
          );
          if (gatewayConnectedUsers) {
            return await entityManager.delete(
              GatewayConnectedUsers,
              gatewayConnectedUsers
            );
          } else {
            return null;
          }
        }
      );
    } catch (e) {
      throw e;
    }
  }

  async deleteAll() {
    try {
      await this.gatewayConnectedUsersRepo
        .createQueryBuilder()
        .delete()
        .execute();
    } catch (e) {
      throw e;
    }
  }
}
