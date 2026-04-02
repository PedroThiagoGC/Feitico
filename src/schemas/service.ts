import { z } from "zod";

export const CreateServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.coerce.number().min(0).transform((v) => Math.round(v * 100) / 100),
  duration: z.coerce.number().int().min(5, "Duração mínima: 5 minutos"),
  buffer_minutes: z.coerce.number().int().min(0).default(0),
  image_url: z.string().nullable().optional(),
  category: z.string().trim().max(50).nullable().optional(),
  is_combo: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateService = z.infer<typeof CreateServiceSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;
