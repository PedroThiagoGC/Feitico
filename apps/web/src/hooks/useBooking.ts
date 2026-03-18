import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Json } from "@/integrations/supabase/types";
import {
  fetchBookings,
  fetchAvailableSlots,
  createBooking,
  calculateCommission as calcCommission,
  generateWhatsAppMessage as genWhatsApp,
  generateWhatsAppApiFallback as genWhatsAppFallback,
} from "@/services/bookingService";

export interface Booking {
  id: string;
  salon_id: string;
  professional_id: string | null;
  customer_name: string;
  customer_phone: string;
  services: Json;
  total_price: number;
  total_duration: number;
  total_buffer_minutes: number;
  total_occupied_minutes: number;
  commission_amount: number;
  profit_amount: number;
  booking_date: string;
  booking_time: string | null;
  booking_type: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export function useBookings(salonId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["bookings", salonId, date],
    queryFn: () => fetchBookings(salonId!, date),
    enabled: !!salonId,
  });
}

/** Subscribe to realtime booking changes to keep slots/bookings fresh */
export function useRealtimeBookings(salonId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!salonId) return;

    const channel = supabase
      .channel(`bookings-realtime-${salonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `salon_id=eq.${salonId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
          queryClient.invalidateQueries({ queryKey: ["available-slots"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, queryClient]);
}

export function useAvailableSlots(
  professionalId: string | undefined,
  date: string | undefined,
  totalOccupiedMinutes: number
) {
  return useQuery({
    queryKey: ["available-slots", professionalId, date, totalOccupiedMinutes],
    queryFn: () => fetchAvailableSlots(professionalId!, date!, totalOccupiedMinutes),
    enabled: !!professionalId && !!date && totalOccupiedMinutes > 0,
  });
}

export interface CreateBookingData {
  salon_id: string;
  professional_id: string;
  customer_name: string;
  customer_phone: string;
  services: { id: string; name: string; price: number; duration: number; buffer: number }[];
  total_price: number;
  total_duration: number;
  total_buffer_minutes: number;
  total_occupied_minutes: number;
  commission_amount: number;
  profit_amount: number;
  booking_date: string;
  booking_time: string | null;
  booking_type: "scheduled" | "walk_in";
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingData) => createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export const calculateCommission = calcCommission;

export interface WhatsAppBookingInfo {
  booking: CreateBookingData;
  salonName: string;
  salonAddress: string;
  salonWhatsapp?: string;
  salonPhone?: string;
  professionalName: string;
}

export const generateWhatsAppMessage = genWhatsApp;
export const generateWhatsAppApiFallback = genWhatsAppFallback;
