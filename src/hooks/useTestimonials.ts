import { useQuery } from "@tanstack/react-query";
import { fetchTestimonials } from "@/services/testimonialService";

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
    queryFn: () => fetchTestimonials(salonId!),
    enabled: !!salonId,
  });
}
