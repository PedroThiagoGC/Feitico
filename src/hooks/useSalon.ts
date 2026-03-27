import { useQuery } from "@tanstack/react-query";
import { getSalon } from "@/services/salonService";
import type { SalonRecord } from "@/types/domain";

export type Salon = SalonRecord;

export function useSalon(salonId?: string) {
  return useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => getSalon(salonId),
  });
}
