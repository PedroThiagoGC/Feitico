import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, SupabaseService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
