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
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Query('salonId') salonId?: string) {
    return this.professionalsService.findAll(salonId);
  }

  @Get('service-links')
  @HttpCode(200)
  async findServiceLinks(@Query('serviceIds') serviceIds?: string) {
    const parsedServiceIds = serviceIds?.split(',').filter(Boolean) || [];
    return this.professionalsService.findServiceLinks(parsedServiceIds);
  }

  @Post(':id/services')
  @HttpCode(201)
  async createServiceLink(@Param('id') id: string, @Body() payload: any) {
    return this.professionalsService.createServiceLink(id, payload);
  }

  @Put('service-links/:linkId')
  @HttpCode(200)
  async updateServiceLink(@Param('linkId') linkId: string, @Body() payload: any) {
    return this.professionalsService.updateServiceLink(linkId, payload);
  }

  @Delete('service-links/:linkId')
  @HttpCode(200)
  async deleteServiceLink(@Param('linkId') linkId: string) {
    return this.professionalsService.deleteServiceLink(linkId);
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    return this.professionalsService.findById(id);
  }

  @Get(':id/services')
  @HttpCode(200)
  async findServices(@Param('id') id: string) {
    return this.professionalsService.findServices(id);
  }

  @Get(':id/availability')
  @HttpCode(200)
  async findAvailability(@Param('id') id: string) {
    return this.professionalsService.findAvailability(id);
  }

  @Post(':id/availability')
  @HttpCode(201)
  async createAvailability(@Param('id') id: string, @Body() payload: any) {
    return this.professionalsService.createAvailability(id, payload);
  }

  @Put('availability/:availabilityId')
  @HttpCode(200)
  async updateAvailability(
    @Param('availabilityId') availabilityId: string,
    @Body() payload: any,
  ) {
    return this.professionalsService.updateAvailability(availabilityId, payload);
  }

  @Delete('availability/:availabilityId')
  @HttpCode(200)
  async deleteAvailability(@Param('availabilityId') availabilityId: string) {
    return this.professionalsService.deleteAvailability(availabilityId);
  }

  @Get(':id/exceptions')
  @HttpCode(200)
  async findExceptions(@Param('id') id: string, @Query('month') month?: string) {
    return this.professionalsService.findExceptions(id, month);
  }

  @Post(':id/exceptions')
  @HttpCode(201)
  async createException(@Param('id') id: string, @Body() payload: any) {
    return this.professionalsService.createException(id, payload);
  }

  @Put('exceptions/:exceptionId')
  @HttpCode(200)
  async updateException(@Param('exceptionId') exceptionId: string, @Body() payload: any) {
    return this.professionalsService.updateException(exceptionId, payload);
  }

  @Delete('exceptions/:exceptionId')
  @HttpCode(200)
  async deleteException(@Param('exceptionId') exceptionId: string) {
    return this.professionalsService.deleteException(exceptionId);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createProfessionalDto: any) {
    return this.professionalsService.create(createProfessionalDto);
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updateProfessionalDto: any) {
    return this.professionalsService.update(id, updateProfessionalDto);
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    return this.professionalsService.delete(id);
  }
}
