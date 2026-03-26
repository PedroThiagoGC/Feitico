import { z } from "zod";

export const BookingServiceItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().min(0),
  duration: z.number().min(5),
  buffer: z.number().min(0),
});

export const CreateBookingSchema = z.object({
  salon_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(8).max(20),
  services: z.array(BookingServiceItemSchema).min(1),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  booking_time: z.string().nullable(),
  booking_type: z.enum(["scheduled", "walk_in", "waitlist"]),
  notes: z.string().max(500).optional(),
});

export type CreateBookingServiceItem = z.infer<typeof BookingServiceItemSchema>;
export type CreateBooking = z.infer<typeof CreateBookingSchema>;
