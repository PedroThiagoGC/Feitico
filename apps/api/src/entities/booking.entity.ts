import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Professional } from "./professional.entity";
import { Salon } from "./salon.entity";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "salon_id", type: "uuid" })
  salonId: string;

  @ManyToOne(() => Salon, { onDelete: "CASCADE" })
  @JoinColumn({ name: "salon_id" })
  salon: Salon;

  @Column({ name: "professional_id", type: "uuid", nullable: true })
  professionalId: string | null;

  @ManyToOne(() => Professional, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "professional_id" })
  professional: Professional | null;

  @Column({ name: "customer_name", type: "text" })
  customerName: string;

  @Column({ name: "customer_phone", type: "text" })
  customerPhone: string;

  @Column({ type: "jsonb", default: [] })
  services: object[];

  @Column({ name: "total_price", type: "numeric", precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ name: "total_duration", type: "integer", default: 0 })
  totalDuration: number;

  @Column({ name: "total_buffer_minutes", type: "integer", default: 0 })
  totalBufferMinutes: number;

  @Column({ name: "total_occupied_minutes", type: "integer", default: 0 })
  totalOccupiedMinutes: number;

  @Column({ name: "commission_amount", type: "numeric", default: 0 })
  commissionAmount: number;

  @Column({ name: "profit_amount", type: "numeric", default: 0 })
  profitAmount: number;

  @Column({ name: "booking_date", type: "date" })
  bookingDate: string;

  @Column({ name: "booking_time", type: "time", nullable: true })
  bookingTime: string | null;

  @Column({ name: "booking_type", type: "text", default: "scheduled" })
  bookingType: "scheduled" | "walk_in";

  @Column({ type: "text", default: "pending" })
  status: "pending" | "confirmed" | "completed" | "cancelled";

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
