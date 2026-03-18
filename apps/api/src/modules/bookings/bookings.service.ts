import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../services/supabase.service';
import { BookingStatus, CreateBookingInput } from '../../common/types';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(status?: BookingStatus) {
    try {
      let query = this.supabaseService.getClient().from('bookings').select(`
        id,
        service_id,
        professional_id,
        client_name,
        client_email,
        client_phone,
        scheduled_at,
        status,
        notes,
        created_at,
        updated_at,
        services:service_id(id, name, price, duration),
        professionals:professional_id(id, name)
      `);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('scheduled_at', {
        ascending: false,
      });

      if (error) {
        this.logger.error('Failed to fetch bookings', error);
        throw new BadRequestException('Failed to fetch bookings');
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error in findAll', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('bookings')
        .select(`
          id,
          service_id,
          professional_id,
          client_name,
          client_email,
          client_phone,
          scheduled_at,
          status,
          notes,
          created_at,
          updated_at,
          services:service_id(*),
          professionals:professional_id(*)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new NotFoundException('Booking not found');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error finding booking ${id}`, error);
      throw error;
    }
  }

  async create(createBookingInput: CreateBookingInput) {
    try {
      // Validate that service and professional exist
      const serviceExists = await this.supabaseService.findById(
        'services',
        createBookingInput.serviceId,
      );
      if (serviceExists.error) {
        throw new NotFoundException('Service not found');
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('bookings')
        .insert([
          {
            service_id: createBookingInput.serviceId,
            professional_id: createBookingInput.professionalId,
            client_name: createBookingInput.clientName,
            client_email: createBookingInput.clientEmail,
            client_phone: createBookingInput.clientPhone,
            scheduled_at: createBookingInput.scheduledAt.toISOString(),
            status: BookingStatus.PENDING,
            notes: createBookingInput.notes || null,
          },
        ])
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to create booking', error);
        throw new BadRequestException('Failed to create booking');
      }

      return data;
    } catch (error) {
      this.logger.error('Error creating booking', error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<CreateBookingInput>) {
    try {
      const { data, error } = await this.supabaseService.update(
        'bookings',
        id,
        {
          ...(updateData.serviceId && { service_id: updateData.serviceId }),
          ...(updateData.professionalId && {
            professional_id: updateData.professionalId,
          }),
          ...(updateData.clientName && { client_name: updateData.clientName }),
          ...(updateData.clientEmail && {
            client_email: updateData.clientEmail,
          }),
          ...(updateData.clientPhone && {
            client_phone: updateData.clientPhone,
          }),
          ...(updateData.scheduledAt && {
            scheduled_at: updateData.scheduledAt.toISOString(),
          }),
          ...(updateData.notes && { notes: updateData.notes }),
          updated_at: new Date().toISOString(),
        },
      );

      if (error || !data) {
        throw new NotFoundException('Booking not found or update failed');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error updating booking ${id}`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: BookingStatus) {
    try {
      const { data, error } = await this.supabaseService.update(
        'bookings',
        id,
        {
          status,
          updated_at: new Date().toISOString(),
        },
      );

      if (error || !data) {
        throw new NotFoundException('Booking not found');
      }

      return data;
    } catch (error) {
      this.logger.error(`Error updating booking status ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabaseService.delete('bookings', id);

      if (error) {
        throw new NotFoundException('Booking not found');
      }

      return { success: true, message: 'Booking deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting booking ${id}`, error);
      throw error;
    }
  }

  async getStats() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('get_booking_stats');

      if (error) {
        this.logger.error('Failed to get booking stats', error);
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
      }

      return data;
    } catch (error) {
      this.logger.error('Error getting booking stats', error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  }
}
