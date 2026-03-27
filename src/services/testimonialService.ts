import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"

type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"]
type TestimonialInsert = Database["public"]["Tables"]["testimonials"]["Insert"]

export type GetTestimonialsOptions = {
  includeInactive?: boolean
}

export async function getTestimonials(
  salonId: string,
  options?: GetTestimonialsOptions
): Promise<TestimonialRow[]> {
  let query = supabase
    .from("testimonials")
    .select("*")
    .eq("salon_id", salonId)

  if (!options?.includeInactive) {
    query = query.eq("active", true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as TestimonialRow[]
}

export async function createTestimonial(payload: TestimonialInsert): Promise<TestimonialRow> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as TestimonialRow
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from("testimonials").delete().eq("id", id)
  if (error) throw error
}
