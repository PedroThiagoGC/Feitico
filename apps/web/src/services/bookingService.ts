import { supabase } from "@/integrations/supabase/client";
import type { Booking, CreateBookingData, WhatsAppBookingInfo } from "@/hooks/useBooking";
import { buildWhatsAppApiUrl, buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/lib/phone";

/* ── Queries ─────────────────────────────────────────────── */

export async function fetchBookings(
  salonId: string,
  date?: string
): Promise<Booking[]> {
  let query = supabase.from("bookings").select("*").eq("salon_id", salonId);
  if (date) query = query.eq("booking_date", date);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Booking[];
}

/* ── Slot calculation ────────────────────────────────────── */

/** Overtime margin in minutes – allows booking to extend past availability end */
export const OVERTIME_MARGIN = 60;

export interface TimeRange {
  start: number;
  end: number;
}

export interface ExistingBooking {
  booking_time: string | null;
  total_occupied_minutes: number | null;
  total_duration: number | null;
}

/**
 * Pure slot-grid computation — no I/O, fully testable.
 * Returns an array of "HH:mm" strings.
 */
export function computeSlotGrid(
  timeWindows: TimeRange[],
  blockedRanges: TimeRange[],
  existingBookings: ExistingBooking[],
  totalOccupiedMinutes: number,
  overtimeMargin: number = OVERTIME_MARGIN,
): string[] {
  const slots: string[] = [];

  for (const window of timeWindows) {
    for (let m = window.start; m + totalOccupiedMinutes <= window.end + overtimeMargin; m += 5) {
      if (m >= window.end) break;
      const slotStart = m;
      const slotEnd = m + totalOccupiedMinutes;

      const isBlocked = blockedRanges.some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      if (isBlocked) continue;

      const hasConflict = existingBookings.some((b) => {
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
}

/**
 * Check if a slot conflicts with existing bookings (pure function).
 */
export function hasTimeConflict(
  time: string,
  totalOccupiedMinutes: number,
  existingBookings: ExistingBooking[],
): boolean {
  const [h, m] = time.split(":").map(Number);
  const slotStart = h * 60 + m;
  const slotEnd = slotStart + totalOccupiedMinutes;

  return existingBookings.some((b) => {
    if (!b.booking_time) return false;
    const [bh, bm] = b.booking_time.split(":").map(Number);
    const bStart = bh * 60 + bm;
    const bEnd = bStart + (b.total_occupied_minutes || b.total_duration || 30);
    return slotStart < bEnd && slotEnd > bStart;
  });
}

export async function fetchAvailableSlots(
  professionalId: string,
  date: string,
  totalOccupiedMinutes: number
): Promise<string[]> {
  if (totalOccupiedMinutes <= 0) return [];

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

  const customHours = exceptions?.find(
    (e) => e.type === "custom_hours" && e.start_time && e.end_time
  );

  const timeWindows: TimeRange[] = [];

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

  const blockedRanges: TimeRange[] = [];
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

  return computeSlotGrid(timeWindows, blockedRanges, bookings || [], totalOccupiedMinutes);
}

/* ── Double-booking validation ───────────────────────────── */

export async function checkDoubleBooking(
  professionalId: string,
  date: string,
  time: string | null,
  totalOccupiedMinutes: number
): Promise<boolean> {
  if (!time) return false;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("booking_time, total_occupied_minutes, total_duration")
    .eq("professional_id", professionalId)
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"]);

  if (!bookings || bookings.length === 0) return false;

  return hasTimeConflict(time, totalOccupiedMinutes, bookings);
}

/* ── Create booking ──────────────────────────────────────── */

export async function createBooking(data: CreateBookingData) {
  // Validação de conflito antes de inserir
  if (data.booking_time) {
    const hasConflict = await checkDoubleBooking(
      data.professional_id,
      data.booking_date,
      data.booking_time,
      data.total_occupied_minutes
    );
    if (hasConflict) {
      throw new Error("Conflito de horário: já existe um agendamento neste período.");
    }
  }

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
}

/* ── Commission ──────────────────────────────────────────── */

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

/* ── WhatsApp messages ───────────────────────────────────── */

function buildBookingWhatsAppText(info: WhatsAppBookingInfo): string {
  const { booking, salonName, salonAddress, professionalName } = info;

  const servicesList = booking.services
    .map((s) => `• ${s.name} — R$ ${s.price.toFixed(2)}`)
    .join("\n");

  const bookingTypeLabel =
    booking.booking_type === "scheduled" ? "Horário marcado" : "Ordem de chegada";
  const dateFormatted = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR");

  return (
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
    `\nFavor seguir com a confirmação e atendimento. ✨`
  );
}

export function generateWhatsAppMessage(info: WhatsAppBookingInfo) {
  const message = buildBookingWhatsAppText(info);
  const normalizedPhone =
    normalizeWhatsAppPhone(info.salonWhatsapp) ||
    normalizeWhatsAppPhone(info.salonPhone);

  if (!normalizedPhone) {
    return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  return buildWhatsAppUrl(normalizedPhone, message);
}

export function generateWhatsAppApiFallback(info: WhatsAppBookingInfo) {
  const message = buildBookingWhatsAppText(info);
  const normalizedPhone =
    normalizeWhatsAppPhone(info.salonWhatsapp) ||
    normalizeWhatsAppPhone(info.salonPhone);

  if (!normalizedPhone) {
    return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
  }

  return buildWhatsAppApiUrl(normalizedPhone, message);
}
