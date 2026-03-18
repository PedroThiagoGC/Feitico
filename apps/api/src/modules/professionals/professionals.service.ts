import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('professionals')
        .select('*')
        .order('name');

      if (error) {
        this.logger.error('Failed to fetch professionals', error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in findAll', error);
      return [];
    }
  }

  async findById(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .findById('professionals', id);

      if (error || !data) {
        throw new NotFoundException('Professional not found');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error finding professional ${id}`, error);
      throw error;
    }
  }

  async create(createData: any) {
    try {
      const { data, error } = await this.supabaseService.create(
        'professionals',
        createData,
      );

      if (error) {
        this.logger.error('Failed to create professional', error);
        throw new Error('Failed to create professional');
      }

      return data;
    } catch (error) {
      this.logger.error('Error creating professional', error);
      throw error;
    }
  }

  async update(id: string, updateData: any) {
    try {
      const { data, error } = await this.supabaseService.update(
        'professionals',
        id,
        { ...updateData, updated_at: new Date().toISOString() },
      );

      if (error || !data) {
        throw new NotFoundException('Professional not found');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error updating professional ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.supabaseService.delete('professionals', id);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting professional ${id}`, error);
      throw error;
    }
  }
}
