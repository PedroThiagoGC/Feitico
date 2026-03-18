import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(category?: string) {
    try {
      let query = this.supabaseService.getClient().from('gallery').select('*');
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query.order('created_at', {
        ascending: false,
      });
      return data || [];
    } catch (error) {
      this.logger.error('Error in findAll', error);
      return [];
    }
  }

  async findById(id: string) {
    return this.supabaseService.findById('gallery', id);
  }

  async create(createData: any) {
    return this.supabaseService.create('gallery', createData);
  }

  async update(id: string, updateData: any) {
    return this.supabaseService.update('gallery', id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });
  }

  async delete(id: string) {
    return this.supabaseService.delete('gallery', id);
  }
}
