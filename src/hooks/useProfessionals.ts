import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("salon_id", salonId!)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
    enabled: !!salonId,
  });
}

export function useProfessionalServices(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-services", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId!)
        .eq("active", true);
      if (error) throw error;
      return data as ProfessionalService[];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalAvailability(professionalId?: string) {
  return useQuery({
    queryKey: ["professional-availability", professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", professionalId!)
        .eq("active", true)
        .order("weekday");
      if (error) throw error;
      return data as ProfessionalAvailability[];
    },
    enabled: !!professionalId,
  });
}

export function useProfessionalExceptions(professionalId?: string, month?: string) {
  return useQuery({
    queryKey: ["professional-exceptions", professionalId, month],
    queryFn: async () => {
      let query = supabase
        .from("professional_exceptions")
        .select("*")
        .eq("professional_id", professionalId!)
        .order("date");
      if (month) {
        query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ProfessionalException[];
    },
    enabled: !!professionalId,
  });
}
