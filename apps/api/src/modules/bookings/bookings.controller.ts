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
import { BookingsService } from './bookings.service';
import { BookingStatus, CreateBookingSchema } from '../../common/types';
import { z } from 'zod';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @HttpCode(200)
  async findAll(@Query('status') status?: BookingStatus) {
    return this.bookingsService.findAll(status);
  }

  @Get('stats')
  @HttpCode(200)
  async getStats() {
    return this.bookingsService.getStats();
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createBookingDto: any) {
    try {
      const validated = CreateBookingSchema.parse(createBookingDto);
      return this.bookingsService.create(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw error;
    }
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updateBookingDto: any) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Put(':id/status')
  @HttpCode(200)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: BookingStatus },
  ) {
    return this.bookingsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @HttpCode(200)
  async delete(@Param('id') id: string) {
    return this.bookingsService.delete(id);
  }
}
