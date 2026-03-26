import { useQuery } from "@tanstack/react-query";
import { getTestimonials } from "@/services/testimonialService";
import type { Database } from "@/integrations/supabase/types";

export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];

export function useTestimonials(salonId?: string) {
  return useQuery({
    queryKey: ["testimonials", salonId],
    queryFn: () => getTestimonials(salonId!),
    enabled: !!salonId,
  });
}
