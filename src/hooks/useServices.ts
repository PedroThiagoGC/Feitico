import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services/servicesService";
import type { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];

export function useServices(salonId?: string) {
  return useQuery({
    queryKey: ["services", salonId],
    queryFn: () => getServices(salonId!),
    enabled: !!salonId,
  });
}
