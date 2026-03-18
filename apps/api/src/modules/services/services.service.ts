import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(salonId?: string) {
    try {
      let query = this.supabaseService
        .getClient()
        .from('services')
        .select('*')
        .eq('active', true);

      if (salonId) {
        query = query.eq('salon_id', salonId);
      }

      const { data, error } = await query.order('sort_order');
      return data || [];
    } catch (error) {
      this.logger.error('Error in findAll', error);
      return [];
    }
  }

  async findById(id: string) {
    return this.supabaseService.findById('services', id);
  }

  async create(createData: any) {
    return this.supabaseService.create('services', createData);
  }

  async update(id: string, updateData: any) {
    return this.supabaseService.update('services', id, updateData);
  }

  async delete(id: string) {
    return this.supabaseService.update('services', id, { active: false });
  }
}
