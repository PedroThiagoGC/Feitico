import { supabase } from "@/integrations/supabase/client";
import type { Salon } from "@/hooks/useSalon";

export async function fetchSalon(salonId?: string): Promise<Salon> {
  let query = supabase.from("salons").select("*").eq("active", true);

  if (salonId) {
    query = query.eq("id", salonId);
  }

  const { data, error } = await query.limit(1).single();

  if (error) throw error;
  return data as unknown as Salon;
}
