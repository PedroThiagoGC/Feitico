import { z } from "zod";

export const GalleryImageSchema = z.object({
  image_url: z.string().min(1),
  caption: z.string().trim().max(200).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type GalleryImageInput = z.infer<typeof GalleryImageSchema>;
