import { describe, it, expect, vi, beforeEach } from "vitest"
import { calculateCommission, getAvailableSlots } from "@/services/bookingService"
import { supabase } from "@/integrations/supabase/client"

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ChainReturn = { data: unknown; error: null }

/**
 * Cria um objeto de cadeia que é thenable (awaitable) em qualquer ponto
 * e também suporta chamadas encadeadas (.select, .eq, .in).
 * Isso resolve o problema de queries que terminam em .eq() (sem .in()).
 */
function createChain(returnValue: ChainReturn) {
  const resolved = Promise.resolve(returnValue)
  const chain: Record<string, unknown> & PromiseLike<ChainReturn> = {
    then: (res: Parameters<Promise<ChainReturn>["then"]>[0], rej: Parameters<Promise<ChainReturn>["then"]>[1]) =>
      resolved.then(res, rej),
    catch: (rej: Parameters<Promise<ChainReturn>["catch"]>[0]) => resolved.catch(rej),
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
  }
  ;(chain.select as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  ;(chain.eq as ReturnType<typeof vi.fn>).mockReturnValue(chain)
  ;(chain.in as ReturnType<typeof vi.fn>).mockReturnValue(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// calculateCommission
// ---------------------------------------------------------------------------

describe("calculateCommission", () => {
  it("percentage: 100 * 10% = 10", () => {
    expect(calculateCommission(100, "percentage", 10)).toBe(10)
  })

  it("percentage: 200 * 15% = 30", () => {
    expect(calculateCommission(200, "percentage", 15)).toBe(30)
  })

  it("fixed: retorna o valor fixo independente do preço", () => {
    expect(calculateCommission(500, "fixed", 25)).toBe(25)
  })

  it("tipo desconhecido: retorna 0", () => {
    expect(calculateCommission(100, "none", 10)).toBe(0)
  })

  it("percentage 0%: retorna 0", () => {
    expect(calculateCommission(100, "percentage", 0)).toBe(0)
  })

  it("fixed 0: retorna 0", () => {
    expect(calculateCommission(100, "fixed", 0)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getAvailableSlots
// ---------------------------------------------------------------------------

describe("getAvailableSlots", () => {
  const mockFrom = vi.mocked(supabase.from)

  beforeEach(() => {
    mockFrom.mockReset()
  })

  it("retorna [] quando professionalId está vazio", async () => {
    const slots = await getAvailableSlots("", "2025-06-09", 60)
    expect(slots).toEqual([])
  })

  it("retorna [] quando totalOccupiedMinutes é 0", async () => {
    const slots = await getAvailableSlots(crypto.randomUUID(), "2025-06-09", 0)
    expect(slots).toEqual([])
  })

  it("profissional sem disponibilidade configurada → retorna []", async () => {
    const availChain = createChain({ data: [], error: null })
    const exceptionsChain = createChain({ data: [], error: null })
    const bookingsChain = createChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "professional_availability") return availChain
      if (table === "professional_exceptions") return exceptionsChain
      if (table === "bookings") return bookingsChain
      return {} as ReturnType<typeof supabase.from>
    })

    const slots = await getAvailableSlots(crypto.randomUUID(), "2025-06-09", 60)
    expect(slots).toEqual([])
  })

  it("profissional com day_off → retorna []", async () => {
    const availChain = createChain({
      data: [
        {
          professional_id: "p1",
          weekday: 1,
          start_time: "09:00",
          end_time: "18:00",
          active: true,
        },
      ],
      error: null,
    })
    const exceptionsChain = createChain({
      data: [
        {
          type: "day_off",
          start_time: null,
          end_time: null,
        },
      ],
      error: null,
    })
    const bookingsChain = createChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "professional_availability") return availChain
      if (table === "professional_exceptions") return exceptionsChain
      if (table === "bookings") return bookingsChain
      return {} as ReturnType<typeof supabase.from>
    })

    // 2025-06-09 é uma segunda-feira (weekday = 1)
    const slots = await getAvailableSlots(crypto.randomUUID(), "2025-06-09", 60)
    expect(slots).toEqual([])
  })

  it("disponibilidade 09:00-18:00, sem bookings, 60 min → contém slots de 5 em 5 min a partir das 09:00", async () => {
    const availChain = createChain({
      data: [
        {
          professional_id: "p1",
          weekday: 1,
          start_time: "09:00",
          end_time: "18:00",
          active: true,
        },
      ],
      error: null,
    })
    const exceptionsChain = createChain({ data: [], error: null })
    const bookingsChain = createChain({ data: [], error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === "professional_availability") return availChain
      if (table === "professional_exceptions") return exceptionsChain
      if (table === "bookings") return bookingsChain
      return {} as ReturnType<typeof supabase.from>
    })

    const slots = await getAvailableSlots(crypto.randomUUID(), "2025-06-09", 60)

    expect(slots).toContain("09:00")
    expect(slots).toContain("09:05")
    expect(slots).toContain("09:10")

    // O intervalo entre slots consecutivos deve ser sempre 5 minutos
    const idx0 = slots.indexOf("09:00")
    const idx1 = slots.indexOf("09:05")
    expect(idx1).toBe(idx0 + 1)
  })

  it("booking existente das 10:00 (60 min) → slot das 10:00 ausente, vizinhos presentes", async () => {
    const availChain = createChain({
      data: [
        {
          professional_id: "p1",
          weekday: 1,
          start_time: "09:00",
          end_time: "18:00",
          active: true,
        },
      ],
      error: null,
    })
    const exceptionsChain = createChain({ data: [], error: null })
    const bookingsChain = createChain({
      data: [
        {
          booking_time: "10:00",
          total_occupied_minutes: 60,
          total_duration: 60,
        },
      ],
      error: null,
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === "professional_availability") return availChain
      if (table === "professional_exceptions") return exceptionsChain
      if (table === "bookings") return bookingsChain
      return {} as ReturnType<typeof supabase.from>
    })

    const slots = await getAvailableSlots(crypto.randomUUID(), "2025-06-09", 60)

    // O slot das 10:00 está ocupado: qualquer início que sobreponha [10:00, 11:00) deve sumir
    expect(slots).not.toContain("10:00")
    expect(slots).not.toContain("09:05") // inicia 09:05, ocupa até 10:05 → conflito com 10:00–11:00
    expect(slots).not.toContain("09:55") // inicia 09:55, ocupa até 10:55 → conflito

    // Slots antes do conflito devem estar presentes
    expect(slots).toContain("09:00") // ocupa 09:00–10:00, sem sobreposição com 10:00–11:00

    // Slots após o término do booking (≥ 11:00) devem estar presentes
    expect(slots).toContain("11:00")
  })
})
