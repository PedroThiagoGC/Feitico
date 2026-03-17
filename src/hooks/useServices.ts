import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  image_url: string | null;
  category: string | null;
  is_combo: boolean;
  active: boolean;
  sort_order: number;
}

export function useServices(salonId?: string) {
  return useQuery({
    queryKey: ["services", salonId],
    queryFn: async () => {
      let query = supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      if (salonId) {
        query = query.eq("salon_id", salonId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!salonId,
  });
}
