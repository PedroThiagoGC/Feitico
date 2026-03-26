import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"]

export async function getTestimonials(salonId: string): Promise<TestimonialRow[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("salon_id", salonId)
    .eq("active", true)
  if (error) throw error
  return data as TestimonialRow[]
}
