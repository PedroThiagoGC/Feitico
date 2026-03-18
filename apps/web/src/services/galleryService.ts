import { supabase } from "@/integrations/supabase/client";
import type { GalleryImage } from "@/hooks/useGallery";

export async function fetchGallery(salonId: string): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as GalleryImage[];
}
