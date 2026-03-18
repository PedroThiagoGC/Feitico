import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Preço não pode ser negativo"),
  duration: z.coerce.number().int().min(5, "Duração mínima: 5 minutos"),
  buffer_minutes: z.coerce.number().int().min(0).default(0),
  image_url: z.string().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  is_combo: z.boolean().default(false),
  active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
