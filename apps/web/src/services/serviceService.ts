import { supabase } from "@/integrations/supabase/client";
import type { Service } from "@/hooks/useServices";

export async function fetchServices(salonId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Service[];
}
