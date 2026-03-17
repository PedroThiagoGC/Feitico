import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("salon_id", salonId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
    enabled: !!salonId,
  });
}
