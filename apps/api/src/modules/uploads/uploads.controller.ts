import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("image")
  @HttpCode(201)
  async uploadImage(@Body() payload: any) {
    return this.uploadsService.uploadImage(payload);
  }
}
