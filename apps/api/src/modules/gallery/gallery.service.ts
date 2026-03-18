import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(salonId?: string) {
    try {
      let query = this.supabaseService
        .getClient()
        .from('gallery_images')
        .select('*');

      if (salonId) {
        query = query.eq('salon_id', salonId);
      }

      const { data, error } = await query.order('sort_order', {
        ascending: true,
      });

      if (error) {
        this.logger.error('Error in findAll', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in findAll', error);
      return [];
    }
  }

  async findById(id: string) {
    return this.supabaseService.findById('gallery_images', id);
  }

  async create(createData: any) {
    return this.supabaseService.create('gallery_images', createData);
  }

  async update(id: string, updateData: any) {
    return this.supabaseService.update('gallery_images', id, updateData);
  }

  async delete(id: string) {
    return this.supabaseService.delete('gallery_images', id);
  }
}
