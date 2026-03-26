import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"]

export async function getGallery(salonId: string): Promise<GalleryImageRow[]> {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data as GalleryImageRow[]
}
