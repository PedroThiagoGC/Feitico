import { useQuery } from "@tanstack/react-query";
import { getGallery } from "@/services/galleryService";
import type { Database } from "@/integrations/supabase/types";

export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];

export function useGallery(salonId?: string) {
  return useQuery({
    queryKey: ["gallery", salonId],
    queryFn: () => getGallery(salonId!),
    enabled: !!salonId,
  });
}
