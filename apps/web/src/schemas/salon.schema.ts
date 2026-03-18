import { z } from "zod";

export const salonSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório").max(120),
  phone: z.string().trim().min(10, "Telefone inválido").max(20).nullable().optional(),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20).nullable().optional(),
  address: z.string().trim().max(250).nullable().optional(),
  about_text: z.string().trim().max(2000).nullable().optional(),
  video_url: z.string().url("URL inválida").max(500).nullable().optional().or(z.literal("")),
  instagram: z.string().trim().max(200).nullable().optional(),
  facebook: z.string().trim().max(200).nullable().optional(),
  logo_url: z.string().max(500).nullable().optional(),
  hero_image_url: z.string().max(500).nullable().optional(),
  primary_color: z.string().max(10).nullable().optional(),
});

export type SalonFormData = z.infer<typeof salonSchema>;
