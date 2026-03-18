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

export function useAvailableSlots(
  professionalId: string | undefined,
  date: string | undefined,
  totalOccupiedMinutes: number
) {
  return useQuery({
    queryKey: ["available-slots", professionalId, date, totalOccupiedMinutes],
    queryFn: async () => {
      if (!professionalId || !date || totalOccupiedMinutes <= 0) return [];

      const dayOfWeek = new Date(date + "T12:00:00").getDay();

      const { data: avail } = await supabase
        .from("professional_availability")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("weekday", dayOfWeek)
        .eq("active", true);

      if (!avail || avail.length === 0) return [];

      const { data: exceptions } = await supabase
        .from("professional_exceptions")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("date", date);

      const dayOff = exceptions?.find(
        (e) => e.type === "day_off" || (e.type === "blocked" && !e.start_time && !e.end_time)
      );
      if (dayOff) return [];

      const customHours = exceptions?.find((e) => e.type === "custom_hours" && e.start_time && e.end_time);
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

      const blockedRanges: { start: number; end: number }[] = [];
      for (const ex of exceptions || []) {
        if (ex.type === "blocked" && ex.start_time && ex.end_time) {
          const [sh, sm] = ex.start_time.split(":").map(Number);
          const [eh, em] = ex.end_time.split(":").map(Number);
          blockedRanges.push({ start: sh * 60 + sm, end: eh * 60 + em });
        }
      }

      const { data: bookings } = await supabase
        .from("bookings")
        .select("booking_time, total_occupied_minutes, total_duration")
        .eq("professional_id", professionalId)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"]);

      const slots: string[] = [];

      for (const window of timeWindows) {
        for (let m = window.start; m + totalOccupiedMinutes <= window.end; m += 5) {
          const slotStart = m;
          const slotEnd = m + totalOccupiedMinutes;

          const isBlocked = blockedRanges.some(
            (b) => slotStart < b.end && slotEnd > b.start
          );
          if (isBlocked) continue;

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

export interface WhatsAppBookingInfo {
  booking: CreateBookingData;
  salonName: string;
  salonAddress: string;
  salonWhatsapp?: string;
  salonPhone?: string;
  professionalName: string;
}

export function generateWhatsAppMessage(info: WhatsAppBookingInfo) {
  const { booking, salonName, salonAddress, professionalName } = info;

  const servicesList = booking.services
    .map((s) => `• ${s.name} — R$ ${s.price.toFixed(2)}`)
    .join("\n");

  const bookingTypeLabel = booking.booking_type === "scheduled" ? "Horário marcado" : "Ordem de chegada";
  const dateFormatted = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR");

  const message =
    `Olá, segue novo agendamento confirmado:\n\n` +
    `👤 *Cliente:* ${booking.customer_name}\n` +
    `📱 *Telefone:* ${booking.customer_phone}\n\n` +
    `🏢 *Unidade:* ${salonName}\n` +
    `📍 *Endereço:* ${salonAddress || "Não informado"}\n\n` +
    `💈 *Profissional:* ${professionalName}\n\n` +
    `✂️ *Serviços:*\n${servicesList}\n\n` +
    `💰 *Valor total:* R$ ${booking.total_price.toFixed(2)}\n` +
    `⏱️ *Duração total:* ${booking.total_duration} min\n` +
    `🔄 *Margem operacional:* ${booking.total_buffer_minutes} min\n` +
    `📊 *Tempo total reservado na agenda:* ${booking.total_occupied_minutes} min\n\n` +
    `📋 *Tipo de atendimento:* ${bookingTypeLabel}\n` +
    `📅 *Data:* ${dateFormatted}\n` +
    (booking.booking_time ? `🕐 *Horário:* ${booking.booking_time}\n` : "") +
    `\nFavor seguir com a confirmação e atendimento. ✨`;

  // Use the salon's whatsapp number, fallback to phone, then a default
  const phone = (info.salonWhatsapp || info.salonPhone || "5511961765421").replace(/\D/g, "");
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}
