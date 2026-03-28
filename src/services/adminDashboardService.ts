import { supabase } from "@/integrations/supabase/client";

type DashboardBookingRow = {
  commission_amount: number | null;
  professional_id: string | null;
  profit_amount: number | null;
  status: "confirmed" | "completed";
  total_duration: number;
  total_occupied_minutes: number | null;
  total_price: number;
};

type FinanceiroBookingRow = {
  booking_date: string;
  booking_time: string | null;
  commission_amount: number;
  customer_name: string;
  id: string;
  professional_id: string | null;
  profit_amount: number;
  services: { id: string; name: string; price: number; duration: number }[];
  status: string;
  total_occupied_minutes: number;
  total_price: number;
};

type ProfessionalSummaryRow = {
  id: string;
  name: string;
};

export type DashboardStats = {
  bookings: number;
  pending: number;
  professionals: number;
  services: number;
};

export type DashboardFinancial = {
  commission: number;
  confirmedCount: number;
  count: number;
  pendingRevenue: number;
  profit: number;
  revenue: number;
};

export type DashboardFinancialPro = {
  commission: number;
  count: number;
  id: string;
  name: string;
  occupied: number;
  profit: number;
  revenue: number;
  ticket: number;
};

export type DashboardOverview = {
  financial: DashboardFinancial;
  proStats: DashboardFinancialPro[];
  stats: DashboardStats;
};

export type FinanceiroByService = {
  count: number;
  percentOfTotal: number;
  revenue: number;
  serviceId: string;
  serviceName: string;
};

export type FinanceiroClienteItem = {
  avgDaysBetweenVisits: number | null;
  count: number;
  isNew: boolean; // first ever booking in period
  lastBookingDate: string | null;
  phone: string;
  revenue: number;
  ticket: number;
  topServices: string[];
  clientName: string;
};

export type FinanceiroClientes = {
  avgReturnIntervalDays: number | null; // salon-wide average
  newClients: number;
  recurringClients: number;
  topClients: FinanceiroClienteItem[];
  totalUniqueClients: number;
};

export type FinanceiroProfissionalBooking = {
  bookingDate: string;
  bookingTime: string | null;
  commissionAmount: number;
  customerName: string;
  id: string;
  profitAmount: number;
  serviceNames: string;
  status: string;
  totalOccupiedMinutes: number;
  totalPrice: number;
};

export type FinanceiroProfissionalData = {
  bookings: FinanceiroProfissionalBooking[];
  commission: number;
  commissionPending: number;
  count: number;
  profit: number;
  revenue: number;
  ticket: number;
};

export async function getDashboardOverview(
  salonId: string,
  dateFrom: string,
  dateTo: string
): Promise<DashboardOverview> {
  const [
    { count: bookingsCount, error: bookingsCountError },
    { count: servicesCount, error: servicesCountError },
    { count: pendingCount, error: pendingCountError },
    { count: professionalsCount, error: professionalsCountError },
    { data: professionalsData, error: professionalsError },
    { data: bookingsData, error: bookingsError },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase.from("services").select("*", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("salon_id", salonId).eq("status", "pending"),
    supabase.from("professionals").select("*", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase.from("professionals").select("id, name").eq("salon_id", salonId),
    supabase
      .from("bookings")
      .select("professional_id, total_price, commission_amount, profit_amount, total_occupied_minutes, total_duration, status")
      .eq("salon_id", salonId)
      .in("status", ["confirmed", "completed"])
      .gte("booking_date", dateFrom)
      .lte("booking_date", dateTo),
  ]);

  const firstError =
    bookingsCountError ??
    servicesCountError ??
    pendingCountError ??
    professionalsCountError ??
    professionalsError ??
    bookingsError;

  if (firstError) throw firstError;

  const allBookings = (bookingsData as DashboardBookingRow[] | null) ?? [];
  const completedBookings = allBookings.filter((booking) => booking.status === "completed");
  const confirmedBookings = allBookings.filter((booking) => booking.status === "confirmed");
  const professionals = (professionalsData as ProfessionalSummaryRow[] | null) ?? [];

  const financial: DashboardFinancial = {
    commission: completedBookings.reduce(
      (total, booking) => total + Number(booking.commission_amount ?? 0),
      0
    ),
    confirmedCount: confirmedBookings.length,
    count: completedBookings.length,
    pendingRevenue: confirmedBookings.reduce((total, booking) => total + Number(booking.total_price), 0),
    profit: completedBookings.reduce((total, booking) => total + Number(booking.profit_amount ?? 0), 0),
    revenue: completedBookings.reduce((total, booking) => total + Number(booking.total_price), 0),
  };

  const proStats = professionals
    .map((professional) => {
      const professionalBookings = allBookings.filter(
        (booking) => booking.professional_id === professional.id
      );
      const revenue = professionalBookings.reduce((total, booking) => total + Number(booking.total_price), 0);
      const commission = professionalBookings.reduce(
        (total, booking) => total + Number(booking.commission_amount ?? 0),
        0
      );
      const profit = professionalBookings.reduce(
        (total, booking) => total + Number(booking.profit_amount ?? 0),
        0
      );
      const count = professionalBookings.length;
      const occupied = professionalBookings.reduce(
        (total, booking) => total + (booking.total_occupied_minutes ?? booking.total_duration ?? 0),
        0
      );

      return {
        commission,
        count,
        id: professional.id,
        name: professional.name,
        occupied,
        profit,
        revenue,
        ticket: count > 0 ? revenue / count : 0,
      };
    })
    .sort((left, right) => right.revenue - left.revenue);

  return {
    financial,
    proStats,
    stats: {
      bookings: bookingsCount ?? 0,
      pending: pendingCount ?? 0,
      professionals: professionalsCount ?? 0,
      services: servicesCount ?? 0,
    },
  };
}

export async function getFinanceiroByService(
  salonId: string,
  dateFrom: string,
  dateTo: string
): Promise<FinanceiroByService[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("services, total_price")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("booking_date", dateFrom)
    .lte("booking_date", dateTo);

  if (error) throw error;

  const rows = (data ?? []) as { services: unknown; total_price: number }[];
  const map = new Map<string, { count: number; name: string; revenue: number }>();

  for (const booking of rows) {
    const services = Array.isArray(booking.services) ? booking.services : [];
    const perService = services.length > 0 ? booking.total_price / services.length : 0;
    for (const svc of services as { id: string; name: string; price?: number }[]) {
      const key = svc.id ?? svc.name;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.revenue += svc.price ?? perService;
      } else {
        map.set(key, { count: 1, name: svc.name, revenue: svc.price ?? perService });
      }
    }
  }

  const totalRevenue = Array.from(map.values()).reduce((s, v) => s + v.revenue, 0);

  return Array.from(map.entries())
    .map(([serviceId, v]) => ({
      count: v.count,
      percentOfTotal: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
      revenue: v.revenue,
      serviceId,
      serviceName: v.name,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getFinanceiroProfissional(
  salonId: string,
  professionalId: string,
  dateFrom: string,
  dateTo: string
): Promise<FinanceiroProfissionalData> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_date, booking_time, customer_name, services, total_price, commission_amount, profit_amount, total_occupied_minutes, status"
    )
    .eq("salon_id", salonId)
    .eq("professional_id", professionalId)
    .in("status", ["confirmed", "completed"])
    .gte("booking_date", dateFrom)
    .lte("booking_date", dateTo)
    .order("booking_date", { ascending: false })
    .order("booking_time");

  if (error) throw error;

  const rows = (data ?? []) as FinanceiroBookingRow[];
  const completed = rows.filter((b) => b.status === "completed");
  const confirmed = rows.filter((b) => b.status === "confirmed");

  const revenue = completed.reduce((s, b) => s + Number(b.total_price), 0);
  const commission = completed.reduce((s, b) => s + Number(b.commission_amount), 0);
  const profit = completed.reduce((s, b) => s + Number(b.profit_amount), 0);
  const commissionPending = confirmed.reduce((s, b) => s + Number(b.commission_amount), 0);

  const bookings: FinanceiroProfissionalBooking[] = rows.map((b) => ({
    bookingDate: b.booking_date,
    bookingTime: b.booking_time,
    commissionAmount: Number(b.commission_amount),
    customerName: b.customer_name,
    id: b.id,
    profitAmount: Number(b.profit_amount),
    serviceNames: Array.isArray(b.services)
      ? (b.services as { name: string }[]).map((s) => s.name).join(", ")
      : "",
    status: b.status,
    totalOccupiedMinutes: Number(b.total_occupied_minutes),
    totalPrice: Number(b.total_price),
  }));

  return {
    bookings,
    commission,
    commissionPending,
    count: completed.length,
    profit,
    revenue,
    ticket: completed.length > 0 ? revenue / completed.length : 0,
  };
}

type ClientHistoryRow = {
  booking_date: string;
  customer_phone: string;
};

type ClientPeriodRow = {
  booking_date: string;
  customer_name: string;
  customer_phone: string;
  services: unknown;
  status: string;
  total_price: number;
};

export async function getFinanceiroClientes(
  salonId: string,
  dateFrom: string,
  dateTo: string
): Promise<FinanceiroClientes> {
  // 1. Bookings in period (completed)
  const { data: periodData, error: periodError } = await supabase
    .from("bookings")
    .select("customer_phone, customer_name, total_price, services, booking_date, status")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("booking_date", dateFrom)
    .lte("booking_date", dateTo);

  if (periodError) throw periodError;

  const periodRows = (periodData ?? []) as ClientPeriodRow[];

  if (periodRows.length === 0) {
    return { avgReturnIntervalDays: null, newClients: 0, recurringClients: 0, topClients: [], totalUniqueClients: 0 };
  }

  // Get unique phones from period
  const phones = [...new Set(periodRows.map((b) => b.customer_phone))];

  // 2. All-time history for those phones (to determine new vs returning + avg interval)
  const { data: historyData, error: historyError } = await supabase
    .from("bookings")
    .select("customer_phone, booking_date")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .in("customer_phone", phones)
    .order("booking_date", { ascending: true });

  if (historyError) throw historyError;

  const historyRows = (historyData ?? []) as ClientHistoryRow[];

  // Build history map: phone → all booking dates
  const historyMap = new Map<string, string[]>();
  for (const row of historyRows) {
    const existing = historyMap.get(row.customer_phone) ?? [];
    existing.push(row.booking_date);
    historyMap.set(row.customer_phone, existing);
  }

  // Group period bookings by phone
  const phoneMap = new Map<
    string,
    { dates: string[]; name: string; revenue: number; services: string[] }
  >();
  for (const b of periodRows) {
    const key = b.customer_phone;
    const existing = phoneMap.get(key);
    const svcNames = Array.isArray(b.services)
      ? (b.services as { name: string }[]).map((s) => s.name)
      : [];
    if (existing) {
      existing.revenue += Number(b.total_price);
      existing.dates.push(b.booking_date);
      existing.services.push(...svcNames);
    } else {
      phoneMap.set(key, {
        dates: [b.booking_date],
        name: b.customer_name,
        revenue: Number(b.total_price),
        services: svcNames,
      });
    }
  }

  // Calculate avg interval between visits (for clients with 2+ historical bookings)
  function avgInterval(dates: string[]): number | null {
    if (dates.length < 2) return null;
    const sorted = [...dates].sort();
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff =
        (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) /
        (1000 * 60 * 60 * 24);
      totalDays += diff;
    }
    return Math.round(totalDays / (sorted.length - 1));
  }

  // Top services for client (most frequent in period)
  function topServices(services: string[]): string[] {
    const freq = new Map<string, number>();
    for (const s of services) freq.set(s, (freq.get(s) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  }

  let newClients = 0;
  let recurringClients = 0;
  const allIntervals: number[] = [];

  const topClients: FinanceiroClienteItem[] = Array.from(phoneMap.entries())
    .map(([phone, data]) => {
      const allDates = historyMap.get(phone) ?? data.dates;
      const firstEverDate = allDates[0] ?? data.dates[0];
      const isNew = firstEverDate >= dateFrom && firstEverDate <= dateTo;

      if (isNew) newClients++;
      else recurringClients++;

      const interval = avgInterval(allDates);
      if (interval !== null) allIntervals.push(interval);

      const count = data.dates.length;
      return {
        avgDaysBetweenVisits: interval,
        clientName: data.name,
        count,
        isNew,
        lastBookingDate: [...data.dates].sort().slice(-1)[0] ?? null,
        phone,
        revenue: data.revenue,
        ticket: count > 0 ? data.revenue / count : 0,
        topServices: topServices(data.services),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const avgReturnIntervalDays =
    allIntervals.length > 0
      ? Math.round(allIntervals.reduce((s, v) => s + v, 0) / allIntervals.length)
      : null;

  return {
    avgReturnIntervalDays,
    newClients,
    recurringClients,
    topClients,
    totalUniqueClients: phoneMap.size,
  };
}
