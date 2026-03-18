import { supabase } from "@/integrations/supabase/client";
import type {
  Professional,
  ProfessionalService,
  ProfessionalAvailability,
  ProfessionalException,
} from "@/hooks/useProfessionals";

export async function fetchProfessionals(salonId: string): Promise<Professional[]> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data as Professional[];
}

export async function fetchProfessionalServices(
  professionalId: string
): Promise<ProfessionalService[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true);
  if (error) throw error;
  return data as ProfessionalService[];
}

export async function fetchProfessionalAvailability(
  professionalId: string
): Promise<ProfessionalAvailability[]> {
  const { data, error } = await supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true)
    .order("weekday");
  if (error) throw error;
  return data as ProfessionalAvailability[];
}

export async function fetchProfessionalExceptions(
  professionalId: string,
  month?: string
): Promise<ProfessionalException[]> {
  let query = supabase
    .from("professional_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .order("date");
  if (month) {
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as ProfessionalException[];
}
