import { api } from "@/services/api";
import type { Service } from "@/hooks/useServices";

export async function fetchServices(salonId: string): Promise<Service[]> {
  return api.getServices(salonId) as Promise<Service[]>;
}
