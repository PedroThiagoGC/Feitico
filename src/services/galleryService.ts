import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type GalleryImageRow = Database["public"]["Tables"]["gallery_images"]["Row"]
type GalleryImageInsert = Database["public"]["Tables"]["gallery_images"]["Insert"]

export type GalleryPage = {
  images: GalleryImageRow[]
  hasMore: boolean
  nextPage: number | null
}

export async function getGallery(salonId: string): Promise<GalleryImageRow[]> {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data as GalleryImageRow[]
}

export async function getGalleryPage(
  salonId: string,
  page = 0,
  pageSize = 20
): Promise<GalleryPage> {
  const offset = page * pageSize
  const { data, error } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
    .range(offset, offset + pageSize)

  if (error) throw error

  const images = (data as GalleryImageRow[]) ?? []
  const hasMore = images.length > pageSize

  return {
    images: hasMore ? images.slice(0, pageSize) : images,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  }
}

export async function createGalleryImage(payload: GalleryImageInsert): Promise<GalleryImageRow> {
  const { data, error } = await supabase
    .from("gallery_images")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as GalleryImageRow
}

export async function deleteGalleryImage(id: string): Promise<void> {
  const { error } = await supabase.from("gallery_images").delete().eq("id", id)
  if (error) throw error
}
