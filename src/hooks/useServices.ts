import { useQuery } from "@tanstack/react-query";
import { fetchServices } from "@/services/serviceService";

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  buffer_minutes: number;
  image_url: string | null;
  category: string | null;
  is_combo: boolean;
  active: boolean;
  sort_order: number;
}

export function useServices(salonId?: string) {
  return useQuery({
    queryKey: ["services", salonId],
    queryFn: () => fetchServices(salonId!),
    enabled: !!salonId,
  });
}
