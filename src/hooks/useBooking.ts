import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Booking {
  id: string;
  salon_id: string;
  professional_id: string | null;
  customer_name: string;
  customer_phone: string;
  services: any;
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
    queryFn: async () => {
      let query = supabase.from("bookings").select("*").eq("salon_id", salonId!);
      if (date) query = query.eq("booking_date", date);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Booking[];
    },
    enabled: !!salonId,
  });
}

/**
 * Get available time slots for a professional on a specific date.
 * Uses 5-minute grid, considers availability, exceptions, and existing bookings.
 */
export function useAvailableSlots(
  professionalId: string | undefined,
  date: string | undefined,
  totalOccupiedMinutes: number
) {
  return useQuery({
    queryKey: ["available-slots", professionalId, date, totalOccupiedMinutes],
    queryFn: async () => {
      if (!professionalId || !date || totalOccupiedMinutes <= 0) return [];

      // 1. Get the weekday (0=Sunday, 6=Saturday)
      const dayOfWeek = new Date(date + "T12:00:00").getDay();

      // 2. Get professional recurring availability for this weekday
      const { data: avail } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("weekday", dayOfWeek)
        .eq("active", true);

      if (!avail || avail.length === 0) return [];

      // 3. Get exceptions for this date
      const { data: exceptions } = await supabase
        .from("professional_exceptions")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("date", date);

      // Check for full day off
      const dayOff = exceptions?.find(
        (e) => e.type === "day_off" || (e.type === "blocked" && !e.start_time && !e.end_time)
      );
      if (dayOff) return [];

      // Determine effective time windows
      const customHours = exceptions?.find((e) => e.type === "custom_hours" && e.start_time && e.end_time);
      
      // Use custom hours if available, otherwise use recurring availability
      const timeWindows: { start: number; end: number }[] = [];
      
      if (customHours) {
        const [sh, sm] = customHours.start_time!.split(":").map(Number);
        const [eh, em] = customHours.end_time!.split(":").map(Number);
        timeWindows.push({ start: sh * 60 + sm, end: eh * 60 + em });
      } else {
        for (const a of avail) {
          const [sh, sm] = a.start_time.split(":").map(Number);
          const [eh, em] = a.end_time.split(":").map(Number);
          timeWindows.push({ start: sh * 60 + sm, end: eh * 60 + em });
        }
      }

      // Get blocked ranges from exceptions
      const blockedRanges: { start: number; end: number }[] = [];
      for (const ex of exceptions || []) {
        if (ex.type === "blocked" && ex.start_time && ex.end_time) {
          const [sh, sm] = ex.start_time.split(":").map(Number);
          const [eh, em] = ex.end_time.split(":").map(Number);
          blockedRanges.push({ start: sh * 60 + sm, end: eh * 60 + em });
        }
      }

      // 4. Get existing bookings for this professional on this date
      const { data: bookings } = await supabase
        .from("bookings")
        .select("booking_time, total_occupied_minutes, total_duration")
        .eq("professional_id", professionalId)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);

      // 5. Generate 5-minute grid slots
      const slots: string[] = [];

      for (const window of timeWindows) {
        for (let m = window.start; m + totalOccupiedMinutes <= window.end; m += 5) {
          const slotStart = m;
          const slotEnd = m + totalOccupiedMinutes;

          // Check blocked ranges
          const isBlocked = blockedRanges.some(
            (b) => slotStart < b.end && slotEnd > b.start
          );
          if (isBlocked) continue;

          // Check booking conflicts
          const hasConflict = bookings?.some((b) => {
            if (!b.booking_time) return false;
            const [bh, bm] = b.booking_time.split(":").map(Number);
            const bStart = bh * 60 + bm;
            const bEnd = bStart + (b.total_occupied_minutes || b.total_duration || 30);
            return slotStart < bEnd && slotEnd > bStart;
          });
          if (hasConflict) continue;

          const h = Math.floor(m / 60);
          const min = m % 60;
          slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
        }
      }

      return slots;
    },
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
    mutationFn: async (data: CreateBookingData) => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .insert([{
          salon_id: data.salon_id,
          professional_id: data.professional_id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          services: JSON.parse(JSON.stringify(data.services)),
          total_price: data.total_price,
          total_duration: data.total_duration,
          total_buffer_minutes: data.total_buffer_minutes,
          total_occupied_minutes: data.total_occupied_minutes,
          commission_amount: data.commission_amount,
          profit_amount: data.profit_amount,
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

export function calculateCommission(
  totalPrice: number,
  commissionType: string,
  commissionValue: number
): number {
  if (commissionType === "percentage") {
    return totalPrice * (commissionValue / 100);
  }
  if (commissionType === "fixed") {
    return commissionValue;
  }
  return 0;
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
