import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "feitico-api",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
  }

  ping() {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
    };
  }
}
