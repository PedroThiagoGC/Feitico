import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getBookings,
  getAvailableSlots,
  createBooking,
  calculateCommission,
  generateWhatsAppMessage,
  generateWhatsAppApiFallback,
  type GetBookingsOptions,
} from "@/services/bookingService";
import type { BookingRecord } from "@/types/domain";

export type Booking = BookingRecord;
export type { CreateBookingPayload as CreateBookingData } from "@/services/bookingService";
export type { WhatsAppBookingInfo } from "@/services/bookingService";
export { calculateCommission, generateWhatsAppMessage, generateWhatsAppApiFallback };

export function useBookings(salonId: string | undefined, options?: GetBookingsOptions) {
  return useQuery({
    queryKey: ["bookings", salonId, options],
    queryFn: () => getBookings(salonId!, options),
    enabled: !!salonId,
  });
}

/** Subscribe to realtime booking changes to keep slots/bookings fresh */
export function useRealtimeBookings(
  salonId: string | undefined,
  onNewBooking?: (payload: Record<string, unknown>) => void
) {
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
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["bookings", salonId] });
          queryClient.invalidateQueries({ queryKey: ["available-slots"] });
          if (payload.eventType === "INSERT" && onNewBooking) {
            onNewBooking(payload.new as Record<string, unknown>);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salonId, queryClient, onNewBooking]);
}

export function useAvailableSlots(
  professionalId: string | undefined,
  date: string | undefined,
  serviceDuration: number,
  bufferMinutes = 0
) {
  return useQuery({
    queryKey: ["available-slots", professionalId, date, serviceDuration, bufferMinutes],
    queryFn: () => getAvailableSlots(professionalId!, date!, serviceDuration, bufferMinutes),
    enabled: !!professionalId && !!date && serviceDuration > 0,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}
