import { useQuery } from "@tanstack/react-query";
import { fetchSalon } from "@/services/salonService";

export interface Salon {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  about_text: string | null;
  video_url: string | null;
  instagram: string | null;
  facebook: string | null;
  opening_hours: Record<string, string> | null;
  active: boolean;
}

export function useSalon(salonId?: string) {
  return useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => fetchSalon(salonId),
  });
}
