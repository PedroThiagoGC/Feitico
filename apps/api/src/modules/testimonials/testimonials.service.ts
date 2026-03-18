import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(filters?: { salonId?: string; minRating?: number }) {
    try {
      let query = this.supabaseService
        .getClient()
        .from('testimonials')
        .select('*')
        .eq('active', true);

      if (filters?.salonId) {
        query = query.eq('salon_id', filters.salonId);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
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
    return this.supabaseService.findById('testimonials', id);
  }

  async create(createData: any) {
    return this.supabaseService.create('testimonials', createData);
  }

  async update(id: string, updateData: any) {
    return this.supabaseService.update('testimonials', id, updateData);
  }

  async delete(id: string) {
    return this.supabaseService.delete('testimonials', id);
  }
}
