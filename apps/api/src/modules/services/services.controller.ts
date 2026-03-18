import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  Query,
} from "@nestjs/common";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Query("salonId") salonId?: string) {
    return this.servicesService.findAll(salonId);
  }

  @Get(":id")
  @HttpCode(200)
  async findById(@Param("id") id: string) {
    return this.servicesService.findById(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createServiceDto: any) {
    return this.servicesService.create(createServiceDto);
  }

  @Put(":id")
  @HttpCode(200)
  async update(@Param("id") id: string, @Body() updateServiceDto: any) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(":id")
  @HttpCode(200)
  async delete(@Param("id") id: string) {
    return this.servicesService.delete(id);
  }
}
