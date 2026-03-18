import { z } from "zod";

// Enums
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum ServiceLevel {
  BASIC = "basic",
  STANDARD = "standard",
  PREMIUM = "premium",
}

export enum UserRole {
  ADMIN = "admin",
  PROFESSIONAL = "professional",
  CLIENT = "client",
}

export const BookingServiceItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  duration: z.coerce.number().int().nonnegative(),
  buffer: z.coerce.number().int().nonnegative().default(0),
});

// Zod Schemas for validation
export const CreateBookingSchema = z.object({
  salon_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  customer_name: z.string().min(3),
  customer_phone: z.string().min(8),
  services: z.array(BookingServiceItemSchema).min(1),
  total_price: z.coerce.number().nonnegative(),
  total_duration: z.coerce.number().int().positive(),
  total_buffer_minutes: z.coerce.number().int().nonnegative().default(0),
  total_occupied_minutes: z.coerce.number().int().positive(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().nullable().optional(),
  booking_type: z.enum(["scheduled", "walk_in"]).default("scheduled"),
  notes: z.string().optional(),
});

export const CreateServiceSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  duration: z.number().min(15),
  price: z.number().positive(),
  level: z.nativeEnum(ServiceLevel),
});

export const CreateProfessionalSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string(),
  specialties: z.array(z.string()).min(1),
});

export const CreateTestimonialSchema = z.object({
  clientName: z.string().min(3),
  rating: z.number().min(1).max(5),
  text: z.string().min(10),
  imageUrl: z.string().url().optional(),
});

export const CreateGalleryImageSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  category: z.string().optional(),
});

// Type exports
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type CreateProfessionalInput = z.infer<typeof CreateProfessionalSchema>;
export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>;
export type CreateGalleryImageInput = z.infer<typeof CreateGalleryImageSchema>;
