import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Service } from "./useServices";

export interface Booking {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_phone: string;
  services: { id: string; name: string; price: number; duration: number }[];
  total_price: number;
  total_duration: number;
  booking_date: string;
  booking_time: string | null;
  booking_type: "scheduled" | "walk_in";
  status: string;
  notes: string | null;
  created_at: string;
}

export function useBookings(salonId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ["bookings", salonId, date],
    queryFn: async () => {
      let query = supabase.from("bookings").select("*").eq("salon_id", salonId!);
      if (date) {
        query = query.eq("booking_date", date);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!salonId,
  });
}

export function useAvailableSlots(
  salonId: string | undefined,
  date: string | undefined,
  totalDuration: number
) {
  return useQuery({
    queryKey: ["available-slots", salonId, date, totalDuration],
    queryFn: async () => {
      if (!salonId || !date || totalDuration <= 0) return [];

      // Get availability for the date
      const { data: avail } = await supabase
        .from("availability")
        .select("*")
        .eq("salon_id", salonId)
        .eq("date", date)
        .maybeSingle();

      if (avail?.is_closed) return [];

      // Get salon opening hours
      const { data: salon } = await supabase
        .from("salons")
        .select("opening_hours")
        .eq("id", salonId)
        .single();

      const dayOfWeek = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
      }).toLowerCase();
      const dayMap: Record<string, string> = {
        sun: "sun", mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat",
      };
      const dayKey = dayMap[dayOfWeek] || dayOfWeek;
      const hours = (salon?.opening_hours as Record<string, string>)?.[dayKey];

      if (!hours || hours === "closed") return [];

      const startTime = avail?.start_time || hours.split("-")[0];
      const endTime = avail?.end_time || hours.split("-")[1];

      // Get existing bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("booking_time, total_duration")
        .eq("salon_id", salonId)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);

      // Generate slots
      const slots: string[] = [];
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (let m = startMinutes; m + totalDuration <= endMinutes; m += 30) {
        const slotStart = m;
        const slotEnd = m + totalDuration;

        const hasConflict = bookings?.some((b) => {
          if (!b.booking_time) return false;
          const [bh, bm] = b.booking_time.split(":").map(Number);
          const bStart = bh * 60 + bm;
          const bEnd = bStart + (b.total_duration || 30);
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (!hasConflict) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
        }
      }

      return slots;
    },
    enabled: !!salonId && !!date && totalDuration > 0,
  });
}

interface CreateBookingData {
  salon_id: string;
  customer_name: string;
  customer_phone: string;
  services: { id: string; name: string; price: number; duration: number }[];
  total_price: number;
  total_duration: number;
  booking_date: string;
  booking_time: string | null;
  booking_type: "scheduled" | "walk_in";
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert([{
          salon_id: data.salon_id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          services: JSON.parse(JSON.stringify(data.services)),
          total_price: data.total_price,
          total_duration: data.total_duration,
          booking_date: data.booking_date,
          booking_time: data.booking_time,
          booking_type: data.booking_type,
        }])
        .select()
        .single();
      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function generateWhatsAppMessage(
  booking: CreateBookingData,
  whatsappNumber: string
) {
  const servicesList = booking.services
    .map((s) => `• ${s.name} (R$ ${s.price.toFixed(2)})`)
    .join("\n");

  const message = `🗓️ *Novo Agendamento*\n\n` +
    `👤 *Nome:* ${booking.customer_name}\n` +
    `📱 *Telefone:* ${booking.customer_phone}\n\n` +
    `✂️ *Serviços:*\n${servicesList}\n\n` +
    `💰 *Total:* R$ ${booking.total_price.toFixed(2)}\n` +
    `⏱️ *Duração:* ${booking.total_duration} min\n` +
    `📅 *Data:* ${new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR")}\n` +
    (booking.booking_time ? `🕐 *Horário:* ${booking.booking_time}\n` : `🚶 *Tipo:* Por ordem de chegada\n`) +
    `\nObrigado pela preferência! ✨`;

  const cleanNumber = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
