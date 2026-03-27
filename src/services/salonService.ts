import { supabase } from "@/integrations/supabase/client"
import type { SalonRecord } from "@/types/domain"

type SalonRow = SalonRecord

const PRIMARY_SALON_ORDER_COLUMN = "created_at"

export async function getSalon(salonId?: string): Promise<SalonRow | null> {
  let query = supabase.from("salons").select("*").eq("active", true)
  if (salonId) {
    query = query.eq("id", salonId)
  } else {
    query = query.order(PRIMARY_SALON_ORDER_COLUMN, { ascending: true })
  }
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function getPrimarySalonId(): Promise<string | null> {
  const primarySalon = await getSalon()
  return primarySalon?.id ?? null
}
