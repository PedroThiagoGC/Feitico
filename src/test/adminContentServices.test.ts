import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { createGalleryImage, getGalleryPage } from "@/services/galleryService";
import { createTestimonial, deleteTestimonial, getTestimonials } from "@/services/testimonialService";
import { deleteService, getServices, saveService } from "@/services/servicesService";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type QueryReturn = {
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
    insert: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    select: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  for (const key of ["delete", "eq", "insert", "order", "range", "select", "update"]) {
    (chain[key] as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  }

  (chain.single as ReturnType<typeof vi.fn>).mockReturnValue(resolved);
  return chain;
}

describe("admin content services", () => {
  beforeEach(() => {
    vi.mocked(supabase.from).mockReset();
  });

  it("getServices keeps the active filter unless includeInactive is enabled", async () => {
    const publicChain = createChain({ data: [], error: null });
    const adminChain = createChain({ data: [], error: null });

    vi.mocked(supabase.from)
      .mockReturnValueOnce(publicChain as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(adminChain as ReturnType<typeof supabase.from>);

    await getServices("salon-1");
    await getServices("salon-1", { includeInactive: true });

    expect((publicChain.eq as ReturnType<typeof vi.fn>).mock.calls).toEqual(
      expect.arrayContaining([
        ["active", true],
        ["salon_id", "salon-1"],
      ])
    );
    expect((adminChain.eq as ReturnType<typeof vi.fn>).mock.calls).toEqual([["salon_id", "salon-1"]]);
  });

  it("saveService returns the saved row on insert", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: {
          id: "service-1",
          salon_id: "salon-1",
          name: "Corte",
        },
        error: null,
      }) as ReturnType<typeof supabase.from>
    );

    const service = await saveService({
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

    expect(service).toMatchObject({
      id: "service-1",
      salon_id: "salon-1",
      name: "Corte",
    });
  });

  it("deleteService throws when Supabase delete fails", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: null,
        error: new Error("delete failed"),
      }) as ReturnType<typeof supabase.from>
    );

    await expect(deleteService("service-1")).rejects.toThrow("delete failed");
  });

  it("getGalleryPage reports hasMore and nextPage correctly", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: [
          { id: "img-1", image_url: "1.jpg" },
          { id: "img-2", image_url: "2.jpg" },
          { id: "img-3", image_url: "3.jpg" },
        ],
        error: null,
      }) as ReturnType<typeof supabase.from>
    );

    const page = await getGalleryPage("salon-1", 1, 2);

    expect(page.images).toHaveLength(2);
    expect(page.hasMore).toBe(true);
    expect(page.nextPage).toBe(2);
  });

  it("createGalleryImage returns the inserted image", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: {
          id: "img-1",
          salon_id: "salon-1",
          image_url: "1.jpg",
        },
        error: null,
      }) as ReturnType<typeof supabase.from>
    );

    const image = await createGalleryImage({
      salon_id: "salon-1",
      image_url: "1.jpg",
      caption: "Legenda",
      sort_order: 0,
    });

    expect(image).toMatchObject({
      id: "img-1",
      salon_id: "salon-1",
      image_url: "1.jpg",
    });
  });

  it("getTestimonials loads all testimonials when includeInactive is enabled", async () => {
    const chain = createChain({
      data: [{ id: "testimonial-1", author_name: "Ana" }],
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValueOnce(chain as ReturnType<typeof supabase.from>);

    const testimonials = await getTestimonials("salon-1", { includeInactive: true });

    expect(testimonials).toHaveLength(1);
    expect((chain.eq as ReturnType<typeof vi.fn>).mock.calls).toEqual([["salon_id", "salon-1"]]);
  });

  it("createTestimonial throws when insert fails", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: null,
        error: new Error("insert failed"),
      }) as ReturnType<typeof supabase.from>
    );

    await expect(
      createTestimonial({
        salon_id: "salon-1",
        author_name: "Ana",
        content: "Excelente",
        rating: 5,
      })
    ).rejects.toThrow("insert failed");
  });

  it("deleteTestimonial resolves when delete succeeds", async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      createChain({
        data: null,
        error: null,
      }) as ReturnType<typeof supabase.from>
    );

    await expect(deleteTestimonial("testimonial-1")).resolves.toBeUndefined();
  });
});
