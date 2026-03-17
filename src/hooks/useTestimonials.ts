import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  salon_id: string;
  author_name: string;
  author_image: string | null;
  content: string;
  rating: number;
  active: boolean;
}

export function useTestimonials(salonId?: string) {
  return useQuery({
    queryKey: ["testimonials", salonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("salon_id", salonId!)
        .eq("active", true);
      if (error) throw error;
      return data as Testimonial[];
    },
    enabled: !!salonId,
  });
}
