import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getNotificationBuckets,
  markReminderSent,
  updateBookingStatus,
} from "@/services/notificationService";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function useAdminNotifications(salonId?: string) {
  const today = getTodayDateString();

  return useQuery({
    queryKey: ["admin-notifications", salonId, today],
    queryFn: () => getNotificationBuckets(salonId!, today),
    enabled: !!salonId,
  });
}

export function useAdminNotificationsRealtime(salonId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!salonId) return;

    const channel = supabase
      .channel(`admin-notifications-${salonId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `salon_id=eq.${salonId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-notifications", salonId] });
          queryClient.invalidateQueries({ queryKey: ["bookings", salonId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, salonId]);
}

export function useBookingStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useReminderSentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, sentAt }: { bookingId: string; sentAt?: string }) =>
      markReminderSent(bookingId, sentAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
