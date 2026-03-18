import { z } from "zod";

export const bookingFormSchema = z.object({
  customer_name: z.string().trim().min(2, "Nome é obrigatório").max(100),
  customer_phone: z.string().trim().min(10, "Telefone inválido").max(20),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;
