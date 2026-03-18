import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  Version,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Query('category') category?: string) {
    return this.galleryService.findAll(category);
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    return this.galleryService.findById(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createGalleryDto: any) {
    return this.galleryService.create(createGalleryDto);
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updateGalleryDto: any) {
    return this.galleryService.update(id, updateGalleryDto);
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    return this.galleryService.delete(id);
  }
}
