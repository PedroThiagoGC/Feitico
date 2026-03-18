import { useQuery } from "@tanstack/react-query";
import {
  fetchProfessionals,
  fetchProfessionalServices,
  fetchProfessionalAvailability,
  fetchProfessionalExceptions,
} from "@/services/professionalService";

export interface Professional {
  id: string;
  salon_id: string;
  name: string;
  photo_url: string | null;
  active: boolean;
  commission_type: string;
  commission_value: number;
  created_at: string;
}

export interface ProfessionalService {
  id: string;
  professional_id: string;
  service_id: string;
  custom_price: number | null;
  custom_duration_minutes: number | null;
  custom_buffer_minutes: number | null;
  commission_override_type: string | null;
  commission_override_value: number | null;
  active: boolean;
}

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface ProfessionalException {
  id: string;
  professional_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  type: string;
  reason: string | null;
  created_at: string;
}

export function useProfessionals(salonId?: string) {
  return useQuery({
    queryKey: ["professionals", salonId],
    queryFn: () => fetchProfessionals(salonId!),
    enabled: !!salonId,
  });
}

export function useProfessionalServices(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: () => fetchProfessionalServices(professionalId!),
    enabled: !!professionalId,
  });
}

export function useProfessionalAvailability(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-availability", professionalId],
    queryFn: () => fetchProfessionalAvailability(professionalId!),
    enabled: !!professionalId,
  });
}

export function useProfessionalExceptions(professionalId?: string, month?: string) {
  return useQuery({
    queryKey: ["professional-exceptions", professionalId, month],
    queryFn: () => fetchProfessionalExceptions(professionalId!, month),
    enabled: !!professionalId,
  });
}
