import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Booking } from "../../entities/booking.entity";
import { BookingStatus, CreateBookingInput } from "../../common/types";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async findAll(filters?: {
    salonId?: string;
    professionalId?: string;
    date?: string;
    status?: BookingStatus;
    statuses?: BookingStatus[];
  }) {
    try {
      const qb = this.bookingRepo
        .createQueryBuilder("b")
        .leftJoinAndSelect("b.professional", "professional")
        .orderBy("b.bookingDate", "DESC")
        .addOrderBy("b.bookingTime", "DESC");

      if (filters?.salonId) qb.andWhere("b.salonId = :salonId", { salonId: filters.salonId });
      if (filters?.professionalId) qb.andWhere("b.professionalId = :pid", { pid: filters.professionalId });
      if (filters?.date) qb.andWhere("b.bookingDate = :date", { date: filters.date });
      if (filters?.statuses?.length) {
        qb.andWhere("b.status IN (:...statuses)", { statuses: filters.statuses });
      } else if (filters?.status) {
        qb.andWhere("b.status = :status", { status: filters.status });
      }

      return await qb.getMany();
    } catch (error) {
      this.logger.error("Error in findAll", error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id },
        relations: ["professional"],
      });
      if (!booking) throw new NotFoundException("Booking not found");
      return booking;
    } catch (error) {
      this.logger.error(`Error finding booking ${id}`, error);
      throw error;
    }
  }

  async create(input: CreateBookingInput) {
    try {
      if (input.booking_time) {
        const conflict = await this.bookingRepo.findOne({
          where: {
            professionalId: input.professional_id,
            bookingDate: input.booking_date,
            bookingTime: input.booking_time,
            status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
          },
        });
        if (conflict) throw new BadRequestException("Time slot is not available");
      }

      const booking = this.bookingRepo.create({
        salonId: input.salon_id,
        professionalId: input.professional_id,
        customerName: input.customer_name,
        customerPhone: input.customer_phone,
        services: input.services as object[],
        totalPrice: input.total_price,
        totalDuration: input.total_duration,
        totalBufferMinutes: input.total_buffer_minutes ?? 0,
        totalOccupiedMinutes: input.total_occupied_minutes ?? 0,
        commissionAmount: 0,
        profitAmount: input.total_price,
        bookingDate: input.booking_date,
        bookingTime: input.booking_time ?? null,
        bookingType: input.booking_type as "scheduled" | "walk_in",
        status: BookingStatus.PENDING as "pending",
        notes: input.notes ?? null,
      });

      return await this.bookingRepo.save(booking);
    } catch (error) {
      this.logger.error("Error creating booking", error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<CreateBookingInput>) {
    try {
      const patch: Partial<Booking> = {};
      if (updateData.salon_id) patch.salonId = updateData.salon_id;
      if (updateData.professional_id) patch.professionalId = updateData.professional_id;
      if (updateData.customer_name) patch.customerName = updateData.customer_name;
      if (updateData.customer_phone) patch.customerPhone = updateData.customer_phone;
      if (updateData.services) patch.services = updateData.services as object[];
      if (updateData.total_price !== undefined) patch.totalPrice = updateData.total_price;
      if (updateData.total_duration !== undefined) patch.totalDuration = updateData.total_duration;
      if (updateData.total_buffer_minutes !== undefined) patch.totalBufferMinutes = updateData.total_buffer_minutes;
      if (updateData.total_occupied_minutes !== undefined) patch.totalOccupiedMinutes = updateData.total_occupied_minutes;
      if (updateData.booking_date) patch.bookingDate = updateData.booking_date;
      if (updateData.booking_time !== undefined) patch.bookingTime = updateData.booking_time ?? null;
      if (updateData.booking_type) patch.bookingType = updateData.booking_type as "scheduled" | "walk_in";
      if (updateData.notes) patch.notes = updateData.notes;

      await this.bookingRepo.update(id, patch);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating booking ${id}`, error);
      throw error;
    }
  }

  async updateStatus(id: string, status: BookingStatus) {
    try {
      const result = await this.bookingRepo.update(id, { status: status as Booking["status"] });
      if (!result.affected) throw new NotFoundException("Booking not found");
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating booking status ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const result = await this.bookingRepo.delete(id);
      if (!result.affected) throw new NotFoundException("Booking not found");
      return { success: true, message: "Booking deleted successfully" };
    } catch (error) {
      this.logger.error(`Error deleting booking ${id}`, error);
      throw error;
    }
  }

  async getStats() {
    try {
      const bookings = await this.bookingRepo.find({ select: ["status"] });
      return {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === "pending").length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        completed: bookings.filter((b) => b.status === "completed").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
      };
    } catch (error) {
      this.logger.error("Error getting booking stats", error);
      return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    }
  }
}
