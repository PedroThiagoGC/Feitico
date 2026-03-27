import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardOverview } from "@/services/adminDashboardService";
import { getGalleryPage } from "@/services/galleryService";
import { getAvailabilityForProfessionals } from "@/services/professionalService";
import { saveService } from "@/services/servicesService";
import {
  buildClientWhatsAppUrl,
  getClientsPage,
  lookupClientByPhone,
} from "@/services/clientService";
import {
  buildReminderMessage,
  getNotificationBuckets,
  markReminderSent,
} from "@/services/notificationService";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type QueryReturn = {
  count?: number | null;
  data: unknown;
  error: Error | null;
};

function createChain(returnValue: QueryReturn) {
  const resolved = Promise.resolve(returnValue);
  const chain: Record<string, unknown> & PromiseLike<QueryReturn> = {
    then: (res, rej) => resolved.then(res, rej),
    catch: (rej) => resolved.catch(rej),
    delete: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    insert: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    limit: vi.fn(),
    lte: vi.fn(),
    lt: vi.fn(),
    maybeSingle: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  for (const key of ["delete", "eq", "gte", "insert", "in", "is", "limit", "lte", "lt", "order", "range", "select", "update"]) {
    (chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  }

  (chain.maybeSingle as ReturnType<typeof vi.fn>).mockReturnValue(resolved);
  (chain.single as ReturnType<typeof vi.fn>).mockReturnValue(resolved);
  return chain;
}

function mockFromSequence(sequence: Array<{ result: QueryReturn; table: string }>) {
  const mockFrom = vi.mocked(supabase.from);
  mockFrom.mockReset();

  sequence.forEach((entry, index) => {
    mockFrom.mockImplementationOnce((table: string) => {
      expect(table).toBe(entry.table);
      return createChain(entry.result) as ReturnType<typeof supabase.from>;
    });
  });
}

describe("clientService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("buildClientWhatsAppUrl adds Brazil country code when needed", () => {
    expect(buildClientWhatsAppUrl("(11) 98888-7777")).toBe("https://wa.me/5511988887777");
    expect(buildClientWhatsAppUrl("5511988887777")).toBe("https://wa.me/5511988887777");
  });

  it("lookupClientByPhone returns null for incomplete phone without querying Supabase", async () => {
    const result = await lookupClientByPhone("salon-1", "12345");
    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("getClientsPage aggregates stats for loaded clients", async () => {
    mockFromSequence([
      {
        table: "clients",
        result: {
          data: [
            {
              created_at: "2026-03-20T10:00:00.000Z",
              id: "client-1",
              last_seen_at: "2026-03-25T10:00:00.000Z",
              merged_into_id: null,
              phone_normalized: "11999999999",
              preferred_name: "Ana",
              salon_id: "salon-1",
              updated_at: "2026-03-25T10:00:00.000Z",
            },
          ],
          error: null,
        },
      },
      {
        table: "bookings",
        result: {
          data: [
            { booking_date: "2026-03-21", client_id: "client-1", total_price: 80 },
            { booking_date: "2026-03-25", client_id: "client-1", total_price: "120" },
          ],
          error: null,
        },
      },
    ]);

    const page = await getClientsPage("salon-1", 0, 1);

    expect(page.hasMore).toBe(true);
    expect(page.nextPage).toBe(1);
    expect(page.clients).toHaveLength(1);
    expect(page.clients[0].stats).toEqual({
      client_id: "client-1",
      count: 2,
      last_date: "2026-03-25",
      total: 200,
    });
  });
});

describe("notificationService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("buildReminderMessage includes customer, services, date and time", () => {
    const message = buildReminderMessage({
      booking_date: "2026-03-27",
      booking_time: "14:30",
      customer_name: "Marina",
      services: [{ duration: 60, name: "Corte" }, { duration: 30, name: "Escova" }],
    } as Parameters<typeof buildReminderMessage>[0]);

    expect(message).toContain("Marina");
    expect(message).toContain("Corte, Escova");
    expect(message).toContain("14:30");
  });

  it("getNotificationBuckets throws when one of the Supabase queries fails", async () => {
    mockFromSequence([
      {
        table: "bookings",
        result: { data: [], error: new Error("pending failed") },
      },
      {
        table: "bookings",
        result: { data: [], error: null },
      },
      {
        table: "bookings",
        result: { data: [], error: null },
      },
    ]);

    await expect(getNotificationBuckets("salon-1", "2026-03-27")).rejects.toThrow("pending failed");
  });

  it("markReminderSent throws when update fails", async () => {
    mockFromSequence([
      {
        table: "bookings",
        result: { data: null, error: new Error("update failed") },
      },
    ]);

    await expect(markReminderSent("booking-1")).rejects.toThrow("update failed");
  });
});

describe("servicesService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("saveService creates a service when id is not provided", async () => {
    const chain = createChain({
      data: {
        id: "service-1",
        name: "Corte",
      },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      expect(table).toBe("services");
      return chain as ReturnType<typeof supabase.from>;
    });

    const created = await saveService({
      salon_id: "salon-1",
      name: "Corte",
      description: null,
      price: 80,
      duration: 60,
      buffer_minutes: 10,
      image_url: null,
      category: null,
      is_combo: false,
      active: true,
      sort_order: 1,
    });

    expect(chain.insert).toHaveBeenCalledOnce();
    expect(chain.update).not.toHaveBeenCalled();
    expect(created).toMatchObject({ id: "service-1", name: "Corte" });
  });

  it("saveService updates a service when id is provided", async () => {
    const chain = createChain({
      data: {
        id: "service-1",
        name: "Escova",
      },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      expect(table).toBe("services");
      return chain as ReturnType<typeof supabase.from>;
    });

    const updated = await saveService({
      id: "service-1",
      salon_id: "salon-1",
      name: "Escova",
      description: "Atualizado",
      price: 120,
      duration: 45,
      buffer_minutes: 5,
      image_url: null,
      category: "Cabelo",
      is_combo: false,
      active: true,
      sort_order: 2,
    });

    expect(chain.update).toHaveBeenCalledOnce();
    expect(chain.insert).not.toHaveBeenCalled();
    expect(updated).toMatchObject({ id: "service-1", name: "Escova" });
  });
});

describe("galleryService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("getGalleryPage reports nextPage when more records are available", async () => {
    mockFromSequence([
      {
        table: "gallery_images",
        result: {
          data: Array.from({ length: 21 }, (_, index) => ({
            id: `img-${index + 1}`,
            image_url: `https://example.com/${index + 1}.jpg`,
          })),
          error: null,
        },
      },
    ]);

    const page = await getGalleryPage("salon-1", 0, 20);

    expect(page.images).toHaveLength(20);
    expect(page.hasMore).toBe(true);
    expect(page.nextPage).toBe(1);
  });
});

describe("professionalService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("getAvailabilityForProfessionals returns empty without querying when there are no ids", async () => {
    const result = await getAvailabilityForProfessionals([]);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe("adminDashboardService", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("getDashboardOverview aggregates stats and financial totals", async () => {
    mockFromSequence([
      { table: "bookings", result: { count: 8, data: null, error: null } },
      { table: "services", result: { count: 3, data: null, error: null } },
      { table: "bookings", result: { count: 2, data: null, error: null } },
      { table: "professionals", result: { count: 2, data: null, error: null } },
      {
        table: "professionals",
        result: {
          data: [
            { id: "pro-1", name: "Ana" },
            { id: "pro-2", name: "Bia" },
          ],
          error: null,
        },
      },
      {
        table: "bookings",
        result: {
          data: [
            {
              commission_amount: 20,
              professional_id: "pro-1",
              profit_amount: 80,
              status: "completed",
              total_duration: 60,
              total_occupied_minutes: 70,
              total_price: 100,
            },
            {
              commission_amount: 40,
              professional_id: "pro-1",
              profit_amount: 160,
              status: "confirmed",
              total_duration: 120,
              total_occupied_minutes: 130,
              total_price: 200,
            },
            {
              commission_amount: 10,
              professional_id: "pro-2",
              profit_amount: 40,
              status: "completed",
              total_duration: 45,
              total_occupied_minutes: null,
              total_price: 50,
            },
          ],
          error: null,
        },
      },
    ]);

    const overview = await getDashboardOverview("salon-1", "2026-03-01", "2026-03-31");

    expect(overview.stats).toEqual({
      bookings: 8,
      pending: 2,
      professionals: 2,
      services: 3,
    });
    expect(overview.financial).toEqual({
      commission: 30,
      confirmedCount: 1,
      count: 2,
      pendingRevenue: 200,
      profit: 120,
      revenue: 150,
    });
    expect(overview.proStats[0]).toMatchObject({
      id: "pro-1",
      revenue: 300,
      ticket: 150,
    });
    expect(overview.proStats[1]).toMatchObject({
      id: "pro-2",
      revenue: 50,
      ticket: 50,
    });
  });

  it("getDashboardOverview throws when one of the queries fails", async () => {
    mockFromSequence([
      { table: "bookings", result: { count: null, data: null, error: new Error("count failed") } },
      { table: "services", result: { count: 0, data: null, error: null } },
      { table: "bookings", result: { count: 0, data: null, error: null } },
      { table: "professionals", result: { count: 0, data: null, error: null } },
      { table: "professionals", result: { data: [], error: null } },
      { table: "bookings", result: { data: [], error: null } },
    ]);

    await expect(getDashboardOverview("salon-1", "2026-03-01", "2026-03-31")).rejects.toThrow("count failed");
  });
});
