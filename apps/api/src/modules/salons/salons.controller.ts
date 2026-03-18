import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { SalonsService } from "./salons.service";

@Controller("salons")
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Get("current")
  @HttpCode(200)
  async findCurrent() {
    return this.salonsService.findCurrent();
  }

  @Get(":id")
  @HttpCode(200)
  async findById(@Param("id") id: string) {
    return this.salonsService.findById(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createSalonDto: Record<string, unknown>) {
    return this.salonsService.create(createSalonDto);
  }

  @Put(":id")
  @HttpCode(200)
  async update(
    @Param("id") id: string,
    @Body() updateSalonDto: Record<string, unknown>,
  ) {
    return this.salonsService.update(id, updateSalonDto);
  }
}
