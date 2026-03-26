import { useQuery } from "@tanstack/react-query";
import {
  getProfessionals,
  getProfessionalServices,
  getProfessionalAvailability,
  getProfessionalExceptions,
} from "@/services/professionalService";
import type { Database } from "@/integrations/supabase/types";

export type Professional = Database["public"]["Tables"]["professionals"]["Row"];
export type ProfessionalService = Database["public"]["Tables"]["professional_services"]["Row"];
export type ProfessionalAvailability = Database["public"]["Tables"]["professional_availability"]["Row"];
export type ProfessionalException = Database["public"]["Tables"]["professional_exceptions"]["Row"];

export function useProfessionals(salonId?: string) {
  return useQuery({
    queryKey: ["professionals", salonId],
    queryFn: () => getProfessionals(salonId!),
    enabled: !!salonId,
  });
}

export function useProfessionalServices(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: () => getProfessionalServices(professionalId!),
    enabled: !!professionalId,
  });
}

export function useProfessionalAvailability(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-availability", professionalId],
    queryFn: () => getProfessionalAvailability(professionalId!),
    enabled: !!professionalId,
  });
}

export function useProfessionalExceptions(professionalId?: string, month?: string) {
  return useQuery({
    queryKey: ["professional-exceptions", professionalId, month],
    queryFn: () => getProfessionalExceptions(professionalId!, month),
    enabled: !!professionalId,
  });
}
