import { z } from "zod";

export const UpdateSalonSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().min(2).max(60).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  whatsapp: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  about_text: z.string().trim().max(1000).nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  instagram: z.string().trim().max(100).nullable().optional(),
  facebook: z.string().trim().max(100).nullable().optional(),
  logo_url: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  opening_hours: z.record(z.string(), z.string()).nullable().optional(),
});

export type UpdateSalon = z.infer<typeof UpdateSalonSchema>;
