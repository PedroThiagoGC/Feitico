import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type ProfessionalRow = Database["public"]["Tables"]["professionals"]["Row"]
type ProfessionalInsert = Database["public"]["Tables"]["professionals"]["Insert"]
type ProfessionalUpdate = Database["public"]["Tables"]["professionals"]["Update"]
type ProfessionalServiceRow = Database["public"]["Tables"]["professional_services"]["Row"]
type ProfessionalServiceInsert = Database["public"]["Tables"]["professional_services"]["Insert"]
type ProfessionalServiceUpdate = Database["public"]["Tables"]["professional_services"]["Update"]
type ProfessionalAvailabilityRow = Database["public"]["Tables"]["professional_availability"]["Row"]
type ProfessionalAvailabilityInsert = Database["public"]["Tables"]["professional_availability"]["Insert"]
type ProfessionalAvailabilityUpdate = Database["public"]["Tables"]["professional_availability"]["Update"]
type ProfessionalExceptionRow = Database["public"]["Tables"]["professional_exceptions"]["Row"]
type ProfessionalExceptionInsert = Database["public"]["Tables"]["professional_exceptions"]["Insert"]

export type GetProfessionalsOptions = {
  includeInactive?: boolean
}

export type GetProfessionalServicesOptions = {
  activeOnly?: boolean
}

export type GetProfessionalAvailabilityOptions = {
  includeInactive?: boolean
}

export type GetProfessionalExceptionsOptions = {
  month?: string
  futureOnly?: boolean
}

export async function getProfessionals(
  salonId: string,
  options?: GetProfessionalsOptions
): Promise<ProfessionalRow[]> {
  let query = supabase
    .from("professionals")
    .select("*")
    .eq("salon_id", salonId)
    .order("name")

  if (!options?.includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalRow[]
}

export async function createProfessional(payload: ProfessionalInsert): Promise<ProfessionalRow> {
  const { data, error } = await supabase
    .from("professionals")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalRow
}

export async function updateProfessional(id: string, payload: ProfessionalUpdate): Promise<ProfessionalRow> {
  const { data, error } = await supabase
    .from("professionals")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalRow
}

export async function deleteProfessional(id: string): Promise<void> {
  const { error } = await supabase.from("professionals").delete().eq("id", id)
  if (error) throw error
}

export async function getProfessionalServices(
  professionalId: string,
  options?: GetProfessionalServicesOptions
): Promise<ProfessionalServiceRow[]> {
  let query = supabase
    .from("professional_services")
    .select("*")
    .eq("professional_id", professionalId)

  if (options?.activeOnly !== false) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalServiceRow[]
}

export async function createProfessionalServiceLink(
  payload: ProfessionalServiceInsert
): Promise<ProfessionalServiceRow> {
  const { data, error } = await supabase
    .from("professional_services")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalServiceRow
}

export async function updateProfessionalServiceLink(
  id: string,
  payload: ProfessionalServiceUpdate
): Promise<ProfessionalServiceRow> {
  const { data, error } = await supabase
    .from("professional_services")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalServiceRow
}

export async function deleteProfessionalServiceLink(id: string): Promise<void> {
  const { error } = await supabase.from("professional_services").delete().eq("id", id)
  if (error) throw error
}

export async function getProfessionalAvailability(
  professionalId: string,
  options?: GetProfessionalAvailabilityOptions
): Promise<ProfessionalAvailabilityRow[]> {
  let query = supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .order("weekday")

  if (!options?.includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalAvailabilityRow[]
}

export async function getAvailabilityForProfessionals(
  professionalIds: string[],
  options?: GetProfessionalAvailabilityOptions
): Promise<ProfessionalAvailabilityRow[]> {
  if (professionalIds.length === 0) return []

  let query = supabase
    .from("professional_availability")
    .select("*")
    .in("professional_id", professionalIds)
    .order("weekday")

  if (!options?.includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalAvailabilityRow[]
}

export async function createProfessionalAvailability(
  payload: ProfessionalAvailabilityInsert
): Promise<ProfessionalAvailabilityRow> {
  const { data, error } = await supabase
    .from("professional_availability")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalAvailabilityRow
}

export async function updateProfessionalAvailability(
  id: string,
  payload: ProfessionalAvailabilityUpdate
): Promise<ProfessionalAvailabilityRow> {
  const { data, error } = await supabase
    .from("professional_availability")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalAvailabilityRow
}

export async function deleteProfessionalAvailability(id: string): Promise<void> {
  const { error } = await supabase.from("professional_availability").delete().eq("id", id)
  if (error) throw error
}

export async function getProfessionalExceptions(
  professionalId: string,
  options?: GetProfessionalExceptionsOptions | string
): Promise<ProfessionalExceptionRow[]> {
  const resolvedOptions: GetProfessionalExceptionsOptions =
    typeof options === "string" ? { month: options } : options ?? {}

  let query = supabase
    .from("professional_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .order("date")

  if (resolvedOptions.month) {
    query = query
      .gte("date", `${resolvedOptions.month}-01`)
      .lte("date", `${resolvedOptions.month}-31`)
  }

  if (resolvedOptions.futureOnly) {
    const today = new Date().toISOString().split("T")[0]
    query = query.gte("date", today)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ProfessionalExceptionRow[]
}

export async function createProfessionalException(
  payload: ProfessionalExceptionInsert
): Promise<ProfessionalExceptionRow> {
  const { data, error } = await supabase
    .from("professional_exceptions")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ProfessionalExceptionRow
}

export async function deleteProfessionalException(id: string): Promise<void> {
  const { error } = await supabase.from("professional_exceptions").delete().eq("id", id)
  if (error) throw error
}
