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
