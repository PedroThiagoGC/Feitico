import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('services')
        .select('*')
        .order('name');
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
    return this.supabaseService.update('services', id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });
  }

  async delete(id: string) {
    return this.supabaseService.delete('services', id);
  }
}
