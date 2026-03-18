import { supabase } from "@/integrations/supabase/client";
import type { Testimonial } from "@/hooks/useTestimonials";

export async function fetchTestimonials(salonId: string): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("salon_id", salonId)
    .eq("active", true);
  if (error) throw error;
  return data as Testimonial[];
}
