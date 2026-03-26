import { z } from "zod";

export const TestimonialSchema = z.object({
  author_name: z.string().trim().min(2).max(100),
  author_image: z.string().nullable().optional(),
  content: z.string().trim().min(10).max(500),
  rating: z.number().int().min(1).max(5),
  active: z.boolean().default(true),
});

export type TestimonialInput = z.infer<typeof TestimonialSchema>;
