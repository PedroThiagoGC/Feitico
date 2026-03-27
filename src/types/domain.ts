import type { Database } from "@/integrations/supabase/types";

export type SalonContentFields = {
  about_image_url: string | null;
  about_title: string | null;
  hero_description: string | null;
  hero_subtitle: string | null;
  hero_title: string | null;
  seo_description: string | null;
  seo_title: string | null;
  tagline: string | null;
};

export type SalonRecord = Database["public"]["Tables"]["salons"]["Row"] & SalonContentFields;

export type BookingExtraFields = {
  client_id: string | null;
  reminder_sent_at: string | null;
};

export type BookingRecord = Database["public"]["Tables"]["bookings"]["Row"] & BookingExtraFields;

export type ClientRecord = {
  created_at: string;
  id: string;
  last_seen_at: string | null;
  merged_into_id: string | null;
  phone_normalized: string;
  preferred_name: string;
  salon_id: string;
  updated_at: string;
};

export type ClientAliasRecord = {
  alias_name: string;
  client_id: string;
  id: string;
  last_used_at: string | null;
  usage_count: number;
};
