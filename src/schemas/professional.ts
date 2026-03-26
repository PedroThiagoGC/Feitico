import { z } from "zod";

export const CommissionTypeSchema = z.enum(["percentage", "fixed"]);

export const CreateProfessionalSchema = z.object({
  name: z.string().trim().min(2).max(100),
  photo_url: z.string().nullable().optional(),
  commission_type: CommissionTypeSchema,
  commission_value: z.coerce.number().min(0).max(100),
  active: z.boolean().default(true),
});

export const UpdateProfessionalSchema = CreateProfessionalSchema.partial();

export const ProfessionalAvailabilitySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  active: z.boolean().default(true),
});

export const ExceptionTypeSchema = z.enum(["day_off", "blocked", "custom_hours"]);

export const ProfessionalExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  type: ExceptionTypeSchema,
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().trim().max(200).nullable().optional(),
});

export type CommissionType = z.infer<typeof CommissionTypeSchema>;
export type CreateProfessional = z.infer<typeof CreateProfessionalSchema>;
export type UpdateProfessional = z.infer<typeof UpdateProfessionalSchema>;
export type ProfessionalAvailabilityInput = z.infer<typeof ProfessionalAvailabilitySchema>;
export type ExceptionType = z.infer<typeof ExceptionTypeSchema>;
export type ProfessionalExceptionInput = z.infer<typeof ProfessionalExceptionSchema>;
