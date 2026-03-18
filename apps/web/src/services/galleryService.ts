import { api } from "@/services/api";
import type { GalleryImage } from "@/hooks/useGallery";

export async function fetchGallery(salonId: string): Promise<GalleryImage[]> {
  return api.getGallery(salonId) as Promise<GalleryImage[]>;
}
