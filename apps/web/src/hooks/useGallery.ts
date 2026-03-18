import { useQuery } from "@tanstack/react-query";
import { fetchGallery } from "@/services/galleryService";

export interface GalleryImage {
  id: string;
  salon_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export function useGallery(salonId?: string) {
  return useQuery({
    queryKey: ["gallery", salonId],
    queryFn: () => fetchGallery(salonId!),
    enabled: !!salonId,
  });
}
