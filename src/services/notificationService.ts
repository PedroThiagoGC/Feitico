import { supabase } from "@/integrations/supabase/client";
import type { BookingRecord } from "@/types/domain";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
type ServiceSnapshot = { duration: number; name: string };

export type NotificationBuckets = {
  overdueConfirmed: BookingRecord[];
  pending: BookingRecord[];
  todayConfirmed: BookingRecord[];
};

export function buildReminderMessage(booking: BookingRecord): string {
  const servicesSnapshot = Array.isArray(booking.services) ? (booking.services as ServiceSnapshot[]) : [];
  const serviceNames = servicesSnapshot.map((service) => service.name).join(", ");
  const date = booking.booking_date
    ? new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString("pt-BR")
    : "";
  const time = booking.booking_time ? ` as ${booking.booking_time}` : "";

  return `Ola ${booking.customer_name}! Lembrando do seu agendamento${date ? ` em ${date}` : ""}${time}.\n${serviceNames || "Servicos"}\n\nAte la!`;
}

export async function getNotificationBuckets(
  salonId: string,
  today: string
): Promise<NotificationBuckets> {
  const [
    { data: pending, error: pendingError },
    { data: todayConfirmed, error: todayConfirmedError },
    { data: overdueConfirmed, error: overdueConfirmedError },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .eq("status", "pending")
      .order("booking_date")
      .order("booking_time")
      .limit(50),
    supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .eq("status", "confirmed")
      .eq("booking_date", today)
      .order("booking_time")
      .limit(50),
    supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", salonId)
      .eq("status", "confirmed")
      .lt("booking_date", today)
      .order("booking_date")
      .limit(50),
  ]);

  const firstError = pendingError ?? todayConfirmedError ?? overdueConfirmedError;
  if (firstError) throw firstError;

  return {
    overdueConfirmed: ((overdueConfirmed as BookingRecord[] | null) ?? []).sort((left, right) =>
      left.booking_date.localeCompare(right.booking_date)
    ),
    pending: (pending as BookingRecord[] | null) ?? [],
    todayConfirmed: (todayConfirmed as BookingRecord[] | null) ?? [],
  };
}

export async function markReminderSent(bookingId: string, sentAt = new Date().toISOString()): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ reminder_sent_at: sentAt } as Record<string, string>)
    .eq("id", bookingId);

  if (error) throw error;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) throw error;
}
