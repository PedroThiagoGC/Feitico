import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { SupabaseService } from '../../services/supabase.service';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService, SupabaseService],
  exports: [GalleryService],
})
export class GalleryModule {}
