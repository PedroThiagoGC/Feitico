import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, SupabaseService],
})
export class UploadsModule {}
