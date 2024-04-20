/* eslint-disable @typescript-eslint/no-var-requires */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const Pusher = require("pusher");

@Injectable()
export class PusherService {
  pusher;
  constructor(private readonly config: ConfigService) {
    this.pusher = new Pusher({
      appId: this.config.get<string>("PUSHER_APPID"),
      key: this.config.get<string>("PUSHER_KEY"),
      secret: this.config.get<string>("PUSHER_SECRET"),
      cluster: this.config.get<string>("PUSHER_CLUSTER"),
      useTLS: this.config
        .get<string>("PUSHER_USE_TLS")
        .toLowerCase()
        .includes("true"),
    });
  }
  trigger(channel, event, data: any) {
    this.pusher.trigger(channel, event, data);
  }

  async reSync(type: string, data: any) {
    try {
      this.pusher.trigger("all", "reSync", { type, data });
    } catch (ex) {
      throw ex;
    }
  }

  async reservationChanges(userIds: string[], data: any) {
    try {
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          this.pusher.trigger(userId, "reservationChanges", data);
        }
      }
      this.pusher.trigger("all", "reSync", {
        type: "RESERVATION",
        data: null,
      });
    } catch (ex) {
      throw ex;
    }
  }

  async burialChanges(userIds: string[], data: any) {
    try {
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          this.pusher.trigger(userId, "burialChanges", data);
        }
      }
      this.pusher.trigger("all", "reSync", {
        type: "BURIAL",
        data: null,
      });
    } catch (ex) {
      throw ex;
    }
  }

  async workOrderChanges(userIds: string[], data: any) {
    try {
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          this.pusher.trigger(userId, "workOrderChanges", data);
        }
      }
      this.pusher.trigger("all", "reSync", {
        type: "WORK_ORDER",
        data: null,
      });
    } catch (ex) {
      throw ex;
    }
  }

  async sendNotif(userIds: string[], title: string, description) {
    try {
      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          this.pusher.trigger(userId, "notifAdded", {
            title,
            description,
          });
        }
      }
    } catch (ex) {
      throw ex;
    }
  }
}
