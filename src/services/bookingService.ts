import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { buildWhatsAppUrl, buildWhatsAppWebUrl, normalizeWhatsAppPhone } from "@/lib/phone"
import type { BookingRecord } from "@/types/domain"

type BookingRow = BookingRecord
type UntypedSupabase = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string } | null }>
}

export type GetBookingsOptions = {
  date?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  status?: BookingRow["status"]
}

const GET_BOOKINGS_DEFAULT_LIMIT = 200
const untypedSupabase = supabase as unknown as UntypedSupabase

export async function getBookings(salonId: string, options?: GetBookingsOptions | string): Promise<BookingRow[]> {
  const opts: GetBookingsOptions =
    typeof options === "string" ? { date: options } : options ?? {}

  const limit = opts.limit ?? GET_BOOKINGS_DEFAULT_LIMIT
  const offset = opts.offset ?? 0

  let query = supabase
    .from("bookings")
    .select("*")
    .eq("salon_id", salonId)
    .order("booking_date", { ascending: false })
    .order("booking_time")
    .range(offset, offset + limit - 1)

  if (opts.date) query = query.eq("booking_date", opts.date)
  if (opts.dateFrom) query = query.gte("booking_date", opts.dateFrom)
  if (opts.dateTo) query = query.lte("booking_date", opts.dateTo)
  if (opts.status) query = query.eq("status", opts.status)

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
  booking_type: "scheduled" | "walk_in" | "waitlist"
  status?: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string | null
}

export async function createBooking(payload: CreateBookingPayload): Promise<BookingRow> {
  if (payload.booking_time && payload.total_occupied_minutes > 0) {
    const { data: hasConflict, error: conflictError } = await untypedSupabase.rpc("check_booking_conflict", {
      p_professional_id: payload.professional_id,
      p_booking_date: payload.booking_date,
      p_booking_time: payload.booking_time,
      p_total_occupied_minutes: payload.total_occupied_minutes,
      p_exclude_id: null,
    })

    if (conflictError) throw conflictError
    if (hasConflict) {
      throw new Error("Profissional ja possui agendamento neste horario. Escolha outro horario.")
    }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([
      {
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
        status: payload.status ?? "pending",
        notes: payload.notes ?? null,
      },
    ])
    .select()
    .single()

  if (error) {
    if (error.message?.includes("BOOKING_CONFLICT")) {
      throw new Error("Profissional ja possui agendamento neste horario. Escolha outro horario.")
    }
    throw error
  }

  const createdBooking = booking as unknown as BookingRow

  // Fire-and-forget: upsert client and link client_id to booking
  void untypedSupabase.rpc("upsert_client_by_phone", {
    p_salon_id: payload.salon_id,
    p_phone: payload.customer_phone,
    p_name: payload.customer_name,
  }).then(({ data: clientId }: { data: string | null }) => {
    if (clientId && createdBooking.id) {
      void supabase
        .from("bookings")
        .update({ client_id: clientId } as Database["public"]["Tables"]["bookings"]["Update"] & Record<string, string>)
        .eq("id", createdBooking.id);
    }
  }).catch(() => {});

  // Fire-and-forget: push notification to admin
  void supabase.functions.invoke("notify-admin-push", {
    body: {
      salon_id: payload.salon_id,
      booking: { customer_name: payload.customer_name, booking_time: payload.booking_time },
    },
  }).catch(() => {});

  return createdBooking
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
    .limit(500)

  const OVERTIME_MARGIN = 60
  const now = new Date()
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const isToday = date === todayLocal
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const slots: string[] = []

  for (const window of timeWindows) {
    for (let m = window.start; m + totalOccupiedMinutes <= window.end + OVERTIME_MARGIN; m += 5) {
      if (m >= window.end) break
      const slotStart = m
      const slotEnd = m + totalOccupiedMinutes

      if (isToday && slotStart < nowMinutes) continue

      const isBlocked = blockedRanges.some((b) => slotStart < b.end && slotEnd > b.start)
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

export type WhatsAppRedirectInfo = {
  message: string
  whatsappPhone?: string
  phoneFallback?: string
}

function buildBookingWhatsAppText(info: WhatsAppBookingInfo): string {
  const { booking, salonName, salonAddress, professionalName } = info

  const servicesList = booking.services
    .map((s) => `- ${s.name} - R$ ${s.price.toFixed(2)}`)
    .join("\n")

  const bookingTypeLabel =
    booking.booking_type === "scheduled"
      ? "Horario marcado"
      : booking.booking_type === "waitlist"
        ? "Fila de espera"
        : "Na hora / ordem de chegada"

  const dateFormatted = new Date(booking.booking_date + "T12:00:00").toLocaleDateString("pt-BR")

  return (
    `Ola, segue novo agendamento confirmado:\n\n` +
    `*Cliente:* ${booking.customer_name}\n` +
    `*Telefone:* ${booking.customer_phone}\n\n` +
    `*Unidade:* ${salonName}\n` +
    `*Endereco:* ${salonAddress || "Nao informado"}\n\n` +
    `*Profissional:* ${professionalName}\n\n` +
    `*Servicos:*\n${servicesList}\n\n` +
    `*Valor total:* R$ ${booking.total_price.toFixed(2)}\n` +
    `*Duracao total:* ${booking.total_duration} min\n` +
    `*Margem operacional:* ${booking.total_buffer_minutes} min\n` +
    `*Tempo total reservado na agenda:* ${booking.total_occupied_minutes} min\n\n` +
    `*Tipo de atendimento:* ${bookingTypeLabel}\n` +
    `*Data:* ${dateFormatted}\n` +
    (booking.booking_time ? `*Horario:* ${booking.booking_time}\n` : "") +
    `\nFavor seguir com a confirmacao e atendimento.`
  )
}

function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function generateDirectWhatsAppUrl(info: WhatsAppRedirectInfo): string {
  const normalizedPhone =
    normalizeWhatsAppPhone(info.whatsappPhone) ||
    normalizeWhatsAppPhone(info.phoneFallback)

  const isMobile = isMobileBrowser()

  if (!normalizedPhone) {
    const encodedMessage = encodeURIComponent(info.message)
    return isMobile
      ? `https://wa.me/?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?text=${encodedMessage}`
  }

  return isMobile
    ? buildWhatsAppUrl(normalizedPhone, info.message)
    : buildWhatsAppWebUrl(normalizedPhone, info.message)
}

export function generateWhatsAppMessage(info: WhatsAppBookingInfo): string {
  const message = buildBookingWhatsAppText(info)
  return generateDirectWhatsAppUrl({
    message,
    whatsappPhone: info.salonWhatsapp,
    phoneFallback: info.salonPhone,
  })
}

export function generateWhatsAppApiFallback(info: WhatsAppBookingInfo): string {
  // Mantido por compatibilidade. Agora retorna a mesma rota primaria
  // para evitar a ponte do api.whatsapp.com, que vinha gerando UX ruim.
  return generateWhatsAppMessage(info)
}
