import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type SalonRow = Database["public"]["Tables"]["salons"]["Row"]

export async function getSalon(salonId?: string): Promise<SalonRow | null> {
  let query = supabase.from("salons").select("*").eq("active", true)
  if (salonId) query = query.eq("id", salonId)
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data
}
