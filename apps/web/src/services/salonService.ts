import { api } from "@/services/api";
import type { Salon } from "@/hooks/useSalon";

export async function fetchSalon(salonId?: string): Promise<Salon> {
  return api.getSalon(salonId) as Promise<Salon>;
}
