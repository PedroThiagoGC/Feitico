import { z } from "zod";

export const professionalSchema = z.object({
  name: z.string().trim().min(2, "Nome é obrigatório").max(120),
  photo_url: z.string().max(500).nullable().optional(),
  commission_type: z.enum(["percentage", "fixed"]).default("percentage"),
  commission_value: z.coerce.number().min(0, "Comissão não pode ser negativa"),
  active: z.boolean().default(true),
});

export type ProfessionalFormData = z.infer<typeof professionalSchema>;
