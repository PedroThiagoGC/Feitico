import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { buildWhatsAppUrl, buildWhatsAppApiUrl, normalizeWhatsAppPhone } from "@/lib/phone"

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"]

export async function getBookings(salonId: string, date?: string): Promise<BookingRow[]> {
  let query = supabase.from("bookings").select("*").eq("salon_id", salonId)
  if (date) query = query.eq("booking_date", date)
  const { data, error } = await query
  if (error) throw error
  return data as unknown as BookingRow[]
}

export type CreateBookingPayload = {
  salon_id: string
  professional_id: string
  customer_name: string
  customer_phone: string
  services: { id: string; name: string; price: number; duration: number; buffer: number }[]
  total_price: number
  total_duration: number
  total_buffer_minutes: number
  total_occupied_minutes: number
  commission_amount: number
  profit_amount: number
  booking_date: string
  booking_time: string | null
  booking_type: "scheduled" | "walk_in"
  notes?: string | null
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingRow> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([{
      salon_id: payload.salon_id,
      professional_id: payload.professional_id,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      services: JSON.parse(JSON.stringify(payload.services)),
      total_price: payload.total_price,
      total_duration: payload.total_duration,
      total_buffer_minutes: payload.total_buffer_minutes,
      total_occupied_minutes: payload.total_occupied_minutes,
      commission_amount: payload.commission_amount,
      profit_amount: payload.profit_amount,
      booking_date: payload.booking_date,
      booking_time: payload.booking_time,
      booking_type: payload.booking_type,
      notes: payload.notes ?? null,
    }])
    .select()
    .single()
  if (error) {
    // Erro de conflito de horário gerado pelo trigger PostgreSQL
    if (error.message?.includes("BOOKING_CONFLICT")) {
      throw new Error("Profissional já possui agendamento neste horário. Escolha outro horário.")
    }
    throw error
  }
  return booking as unknown as BookingRow
}

export async function getAvailableSlots(
  professionalId: string,
  date: string,
  totalOccupiedMinutes: number
): Promise<string[]> {
  if (!professionalId || !date || totalOccupiedMinutes <= 0) return []

  const dayOfWeek = new Date(date + "T12:00:00").getDay()

  const { data: avail } = await supabase
    .from("professional_availability")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("weekday", dayOfWeek)
    .eq("active", true)

  if (!avail || avail.length === 0) return []

  const { data: exceptions } = await supabase
    .from("professional_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("date", date)

  const dayOff = exceptions?.find(
    (e) => e.type === "day_off" || (e.type === "blocked" && !e.start_time && !e.end_time)
  )
  if (dayOff) return []

  const customHours = exceptions?.find((e) => e.type === "custom_hours" && e.start_time && e.end_time)
  const timeWindows: { start: number; end: number }[] = []

  if (customHours) {
    const [sh, sm] = customHours.start_time!.split(":").map(Number)
    const [eh, em] = customHours.end_time!.split(":").map(Number)
    timeWindows.push({ start: sh * 60 + sm, end: eh * 60 + em })
  } else {
    for (const a of avail) {
      const [sh, sm] = a.start_time.split(":").map(Number)
      const [eh, em] = a.end_time.split(":").map(Number)
      timeWindows.push({ start: sh * 60 + sm, end: eh * 60 + em })
    }
  }

  const blockedRanges: { start: number; end: number }[] = []
  for (const ex of exceptions || []) {
    if (ex.type === "blocked" && ex.start_time && ex.end_time) {
      const [sh, sm] = ex.start_time.split(":").map(Number)
      const [eh, em] = ex.end_time.split(":").map(Number)
      blockedRanges.push({ start: sh * 60 + sm, end: eh * 60 + em })
    }
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("booking_time, total_occupied_minutes, total_duration")
    .eq("professional_id", professionalId)
    .eq("booking_date", date)
    .in("status", ["pending", "confirmed"])

  const OVERTIME_MARGIN = 60

  const slots: string[] = []

  for (const window of timeWindows) {
    for (let m = window.start; m + totalOccupiedMinutes <= window.end + OVERTIME_MARGIN; m += 5) {
      if (m >= window.end) break
      const slotStart = m
      const slotEnd = m + totalOccupiedMinutes

      const isBlocked = blockedRanges.some(
        (b) => slotStart < b.end && slotEnd > b.start
      )
      if (isBlocked) continue

      const hasConflict = bookings?.some((b) => {
        if (!b.booking_time) return false
        const [bh, bm] = b.booking_time.split(":").map(Number)
        const bStart = bh * 60 + bm
        const bEnd = bStart + (b.total_occupied_minutes || b.total_duration || 30)
        return slotStart < bEnd && slotEnd > bStart
      })
      if (hasConflict) continue

      const h = Math.floor(m / 60)
      const min = m % 60
      slots.push(`${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
    }
  }

  return slots
}

export function calculateCommission(
  totalPrice: number,
  commissionType: string,
  commissionValue: number
): number {
  if (commissionType === "percentage") {
    return totalPrice * (commissionValue / 100)
  }
  if (commissionType === "fixed") {
    return commissionValue
  }
  return 0
}

export type WhatsAppBookingInfo = {
  booking: CreateBookingPayload
  salonName: string
  salonAddress: string
  salonWhatsapp?: string
  salonPhone?: string
  professionalName: string
}

function buildBookingWhatsAppText(info: WhatsAppBookingInfo): string {
  const { booking, salonName, salonAddress, professionalName } = info

  const servicesList = booking.services
    .map((s) => `• ${s.name} — R$ ${s.price.toFixed(2)}`)
    .join("\n")

  const bookingTypeLabel = booking.booking_type === "scheduled" ? "Horário marcado" : "Ordem de chegada"
  const dateFormatted = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR")

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
  )
}

export function generateWhatsAppMessage(info: WhatsAppBookingInfo): string {
  const message = buildBookingWhatsAppText(info)

  const normalizedPhone =
    normalizeWhatsAppPhone(info.salonWhatsapp) ||
    normalizeWhatsAppPhone(info.salonPhone)

  if (!normalizedPhone) {
    return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`
  }

  return buildWhatsAppUrl(normalizedPhone, message)
}

export function generateWhatsAppApiFallback(info: WhatsAppBookingInfo): string {
  const message = buildBookingWhatsAppText(info)

  const normalizedPhone =
    normalizeWhatsAppPhone(info.salonWhatsapp) ||
    normalizeWhatsAppPhone(info.salonPhone)

  if (!normalizedPhone) {
    return `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`
  }

  return buildWhatsAppApiUrl(normalizedPhone, message)
}
