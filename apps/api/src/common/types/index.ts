import { z } from 'zod';

// Enums
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ServiceLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum UserRole {
  ADMIN = 'admin',
  PROFESSIONAL = 'professional',
  CLIENT = 'client',
}

// Zod Schemas for validation
export const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  clientName: z.string().min(3),
  clientEmail: z.string().email(),
  clientPhone: z.string(),
  scheduledAt: z.coerce.date(),
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
