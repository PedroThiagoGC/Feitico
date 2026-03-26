import { useQuery } from "@tanstack/react-query";
import { getSalon } from "@/services/salonService";
import type { Database } from "@/integrations/supabase/types";

export type Salon = Database["public"]["Tables"]["salons"]["Row"];

export function useSalon(salonId?: string) {
  return useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => getSalon(salonId),
  });
}
