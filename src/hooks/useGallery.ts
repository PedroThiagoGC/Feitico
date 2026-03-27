import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGalleryImage, deleteGalleryImage, getGallery, getGalleryPage } from "@/services/galleryService";
import type { Database } from "@/integrations/supabase/types";

export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];
export type GalleryImageInsert = Database["public"]["Tables"]["gallery_images"]["Insert"];

export function useGallery(salonId?: string) {
  return useQuery({
    queryKey: ["gallery", salonId],
    queryFn: () => getGallery(salonId!),
    enabled: !!salonId,
  });
}

export function useInfiniteAdminGallery(salonId?: string, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["admin-gallery", salonId, pageSize],
    queryFn: ({ pageParam }) => getGalleryPage(salonId!, pageParam as number, pageSize),
    enabled: !!salonId,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useCreateGalleryImageMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GalleryImageInsert) => createGalleryImage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", salonId] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", salonId] });
    },
  });
}

export function useDeleteGalleryImageMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGalleryImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery", salonId] });
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", salonId] });
    },
  });
}
