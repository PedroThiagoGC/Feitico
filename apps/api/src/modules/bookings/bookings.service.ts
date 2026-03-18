import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseService } from "../../services/supabase.service";
import { BookingStatus, CreateBookingInput } from "../../common/types";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(filters?: {
    salonId?: string;
    professionalId?: string;
    date?: string;
    status?: BookingStatus;
    statuses?: BookingStatus[];
  }) {
    try {
      let query = this.supabaseService.getClient().from("bookings").select(`
        id,
        salon_id,
        professional_id,
        customer_name,
        customer_phone,
        services,
        total_price,
        total_duration,
        total_buffer_minutes,
        total_occupied_minutes,
        commission_amount,
        profit_amount,
        booking_date,
        booking_time,
        booking_type,
        status,
        notes,
        created_at,
        professionals:professional_id(id, name, photo_url, commission_type, commission_value)
      `);

      if (filters?.salonId) {
        query = query.eq("salon_id", filters.salonId);
      }

      if (filters?.professionalId) {
        query = query.eq("professional_id", filters.professionalId);
      }

      if (filters?.date) {
        query = query.eq("booking_date", filters.date);
      }

      if (filters?.statuses?.length) {
        query = query.in("status", filters.statuses);
      } else if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false, nullsFirst: false });

      if (error) {
        this.logger.error("Failed to fetch bookings", error);
        throw new BadRequestException("Failed to fetch bookings");
      }

      return data || [];
    } catch (error) {
      this.logger.error("Error in findAll", error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from("bookings")
        .select(
          `
          id,
          salon_id,
          professional_id,
          customer_name,
          customer_phone,
          services,
          total_price,
          total_duration,
          total_buffer_minutes,
          total_occupied_minutes,
          commission_amount,
          profit_amount,
          booking_date,
          booking_time,
          booking_type,
          status,
          notes,
          created_at,
          professionals:professional_id(*)
        `,
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        throw new NotFoundException("Booking not found");
      }

      return data;
    } catch (error) {
      this.logger.error(`Error finding booking ${id}`, error);
      throw error;
    }
  }

  async create(createBookingInput: CreateBookingInput) {
    try {
      const { data: salon } = await this.supabaseService.findById(
        "salons",
        createBookingInput.salon_id,
      );

      if (!salon) {
        throw new NotFoundException("Salon not found");
      }

      const { data: professional } = await this.supabaseService.findById(
        "professionals",
        createBookingInput.professional_id,
      );

      if (!professional) {
        throw new NotFoundException("Professional not found");
      }

      const { data: conflictingBookings, error: conflictError } =
        await this.supabaseService
          .getClient()
          .from("bookings")
          .select("id")
          .eq("professional_id", createBookingInput.professional_id)
          .eq("booking_date", createBookingInput.booking_date)
          .eq("booking_time", createBookingInput.booking_time)
          .in("status", [BookingStatus.PENDING, BookingStatus.CONFIRMED]);

      if (conflictError) {
        this.logger.error("Failed to validate booking conflict", conflictError);
        throw new BadRequestException(
          "Failed to validate booking availability",
        );
      }

      if (createBookingInput.booking_time && conflictingBookings?.length) {
        throw new BadRequestException("Time slot is not available");
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from("bookings")
        .insert([
          {
            salon_id: createBookingInput.salon_id,
            professional_id: createBookingInput.professional_id,
            customer_name: createBookingInput.customer_name,
            customer_phone: createBookingInput.customer_phone,
            services: createBookingInput.services,
            total_price: createBookingInput.total_price,
            total_duration: createBookingInput.total_duration,
            total_buffer_minutes: createBookingInput.total_buffer_minutes,
            total_occupied_minutes: createBookingInput.total_occupied_minutes,
            commission_amount: 0,
            profit_amount: createBookingInput.total_price,
            booking_date: createBookingInput.booking_date,
            booking_time: createBookingInput.booking_time ?? null,
            booking_type: createBookingInput.booking_type,
            status: BookingStatus.PENDING,
            notes: createBookingInput.notes || null,
          },
        ])
        .select()
        .single();

      if (error) {
        this.logger.error("Failed to create booking", error);
        throw new BadRequestException("Failed to create booking");
      }

      return data;
    } catch (error) {
      this.logger.error("Error creating booking", error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<CreateBookingInput>) {
    try {
      const { data, error } = await this.supabaseService.update(
        "bookings",
        id,
        {
          ...(updateData.salon_id && { salon_id: updateData.salon_id }),
          ...(updateData.professional_id && {
            professional_id: updateData.professional_id,
          }),
          ...(updateData.customer_name && {
            customer_name: updateData.customer_name,
          }),
          ...(updateData.customer_phone && {
            customer_phone: updateData.customer_phone,
          }),
          ...(updateData.services && { services: updateData.services }),
          ...(updateData.total_price !== undefined && {
            total_price: updateData.total_price,
          }),
          ...(updateData.total_duration !== undefined && {
            total_duration: updateData.total_duration,
          }),
          ...(updateData.total_buffer_minutes !== undefined && {
            total_buffer_minutes: updateData.total_buffer_minutes,
          }),
          ...(updateData.total_occupied_minutes !== undefined && {
            total_occupied_minutes: updateData.total_occupied_minutes,
          }),
          ...(updateData.booking_date && {
            booking_date: updateData.booking_date,
          }),
          ...(updateData.booking_time !== undefined && {
            booking_time: updateData.booking_time,
          }),
          ...(updateData.booking_type && {
            booking_type: updateData.booking_type,
          }),
          ...(updateData.notes && { notes: updateData.notes }),
        },
      );

      if (error || !data) {
        throw new NotFoundException("Booking not found or update failed");
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
        "bookings",
        id,
        {
          status,
        },
      );

      if (error || !data) {
        throw new NotFoundException("Booking not found");
      }

      return data;
    } catch (error) {
      this.logger.error(`Error updating booking status ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.supabaseService.delete("bookings", id);

      if (error) {
        throw new NotFoundException("Booking not found");
      }

      return { success: true, message: "Booking deleted successfully" };
    } catch (error) {
      this.logger.error(`Error deleting booking ${id}`, error);
      throw error;
    }
  }

  async getStats() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from("bookings")
        .select("status");

      if (error) {
        this.logger.error("Failed to get booking stats", error);
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
      }

      return {
        total: data?.length || 0,
        pending:
          data?.filter((booking) => booking.status === BookingStatus.PENDING)
            .length || 0,
        confirmed:
          data?.filter((booking) => booking.status === BookingStatus.CONFIRMED)
            .length || 0,
        completed:
          data?.filter((booking) => booking.status === BookingStatus.COMPLETED)
            .length || 0,
        cancelled:
          data?.filter((booking) => booking.status === BookingStatus.CANCELLED)
            .length || 0,
      };
    } catch (error) {
      this.logger.error("Error getting booking stats", error);
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
