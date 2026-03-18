import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [BookingsController],
  providers: [BookingsService, SupabaseService],
  exports: [BookingsService],
})
export class BookingsModule {}
