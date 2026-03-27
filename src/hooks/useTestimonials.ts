import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonials,
  type GetTestimonialsOptions,
} from "@/services/testimonialService";
import type { Database } from "@/integrations/supabase/types";

export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type TestimonialInsert = Database["public"]["Tables"]["testimonials"]["Insert"];

export function useTestimonials(salonId?: string, options?: GetTestimonialsOptions) {
  return useQuery({
    queryKey: ["testimonials", salonId, options?.includeInactive ?? false],
    queryFn: () => getTestimonials(salonId!, options),
    enabled: !!salonId,
  });
}

export function useAdminTestimonials(salonId?: string) {
  return useTestimonials(salonId, { includeInactive: true });
}

export function useCreateTestimonialMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TestimonialInsert) => createTestimonial(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", salonId] });
    },
  });
}

export function useDeleteTestimonialMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials", salonId] });
    },
  });
}
