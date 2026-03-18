import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  Version,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @HttpCode(200)
  async findAll() {
    return this.professionalsService.findAll();
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    return this.professionalsService.findById(id);
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
