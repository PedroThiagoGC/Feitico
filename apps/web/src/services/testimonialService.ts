import { api } from "@/services/api";
import type { Testimonial } from "@/hooks/useTestimonials";

export async function fetchTestimonials(salonId: string): Promise<Testimonial[]> {
  return api.getTestimonials({ salonId }) as Promise<Testimonial[]>;
}
