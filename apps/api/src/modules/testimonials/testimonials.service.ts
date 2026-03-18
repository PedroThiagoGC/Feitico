import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(minRating?: number) {
    try {
      let query = this.supabaseService
        .getClient()
        .from('testimonials')
        .select('*');
      if (minRating) {
        query = query.gte('rating', minRating);
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
    return this.supabaseService.findById('testimonials', id);
  }

  async create(createData: any) {
    return this.supabaseService.create('testimonials', {
      ...createData,
      created_at: new Date().toISOString(),
    });
  }

  async update(id: string, updateData: any) {
    return this.supabaseService.update('testimonials', id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });
  }

  async delete(id: string) {
    return this.supabaseService.delete('testimonials', id);
  }
}
