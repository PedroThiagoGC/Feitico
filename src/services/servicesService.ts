import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type ServiceRow = Database["public"]["Tables"]["services"]["Row"]
type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"]
type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"]

export type AdminServicePayload = {
  id?: string
  salon_id: string
  name: string
  description?: string | null
  price: number
  duration: number
  buffer_minutes: number
  image_url?: string | null
  category?: string | null
  is_combo: boolean
  active: boolean
  sort_order: number
}

export type GetServicesOptions = {
  includeInactive?: boolean
}

export async function getServices(salonId: string, options?: GetServicesOptions): Promise<ServiceRow[]> {
  let query = supabase
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as ServiceRow[]
}

export async function createService(payload: ServiceInsert): Promise<ServiceRow> {
  const { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ServiceRow
}

export async function updateService(id: string, payload: ServiceUpdate): Promise<ServiceRow> {
  const { data, error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as ServiceRow
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id)
  if (error) throw error
}

export async function saveService(payload: AdminServicePayload): Promise<ServiceRow> {
  const basePayload = {
    salon_id: payload.salon_id,
    name: payload.name,
    description: payload.description ?? null,
    price: payload.price,
    duration: payload.duration,
    buffer_minutes: payload.buffer_minutes,
    image_url: payload.image_url ?? null,
    category: payload.category ?? null,
    is_combo: payload.is_combo,
    active: payload.active,
    sort_order: payload.sort_order,
  }

  if (payload.id) {
    return updateService(payload.id, basePayload satisfies ServiceUpdate)
  }

  return createService(basePayload satisfies ServiceInsert)
}
