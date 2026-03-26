import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type ServiceRow = Database["public"]["Tables"]["services"]["Row"]

export async function getServices(salonId: string): Promise<ServiceRow[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data as ServiceRow[]
}
