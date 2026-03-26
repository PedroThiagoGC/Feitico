import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"]
type ProfessionalServiceRow = Database["public"]["Tables"]["professional_services"]["Row"]
type ProfessionalAvailabilityRow = Database["public"]["Tables"]["professional_availability"]["Row"]
type ProfessionalExceptionRow = Database["public"]["Tables"]["professional_exceptions"]["Row"]

export async function getProfessionals(salonId: string): Promise<ProfessionalRow[]> {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("salon_id", salonId)
    .eq("active", true)
    .order("name")
  if (error) throw error
  return data as ProfessionalRow[]
}

export async function getProfessionalServices(professionalId: string): Promise<ProfessionalServiceRow[]> {
  const { data, error } = await supabase
    .from("professional_services")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true)
  if (error) throw error
  return data as ProfessionalServiceRow[]
}

export async function getProfessionalAvailability(professionalId: string): Promise<ProfessionalAvailabilityRow[]> {
  const { data, error } = await supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true)
    .order("weekday")
  if (error) throw error
  return data as ProfessionalAvailabilityRow[]
}

export async function getProfessionalExceptions(professionalId: string, month?: string): Promise<ProfessionalExceptionRow[]> {
  let query = supabase
    .from("professional_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .order("date")
  if (month) {
    query = query.gte("date", `${month}-01`).lte("date", `${month}-31`)
  }
  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalExceptionRow[]
}
