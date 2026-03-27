import { supabase } from "@/integrations/supabase/client";
import type { ClientRecord } from "@/types/domain";

type QueryResult<TData> = Promise<{ data: TData | null; error: unknown }>;

type SelectQuery<TData> = {
  eq: (column: string, value: string) => SelectQuery<TData>;
  in: (column: string, values: string[]) => SelectQuery<TData>;
  is: (column: string, value: null) => SelectQuery<TData>;
  maybeSingle: () => QueryResult<TData>;
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) => SelectQuery<TData>;
  range: (from: number, to: number) => QueryResult<TData[]>;
  select: (columns: string) => SelectQuery<TData>;
};

type UntypedSupabase = {
  from: <TData>(table: string) => SelectQuery<TData>;
};

type ClientLookup = Pick<ClientRecord, "id" | "phone_normalized" | "preferred_name">;

type ClientBookingStatRow = {
  booking_date: string;
  client_id: string | null;
  total_price: number | string | null;
};

export type ClientStats = {
  client_id: string;
  count: number;
  last_date: string | null;
  total: number;
};

export type ClientListItem = ClientRecord & {
  stats: ClientStats;
};

export type ClientsPage = {
  clients: ClientListItem[];
  hasMore: boolean;
  nextPage: number | undefined;
  page: number;
};

const DEFAULT_PAGE_SIZE = 30;
const untypedSupabase = supabase as unknown as UntypedSupabase;

function getDefaultClientStats(clientId: string): ClientStats {
  return {
    client_id: clientId,
    count: 0,
    last_date: null,
    total: 0,
  };
}

function buildStatsMap(rows: ClientBookingStatRow[]): Map<string, ClientStats> {
  const statsByClient = new Map<string, ClientStats>();

  for (const row of rows) {
    if (!row.client_id) continue;

    const current = statsByClient.get(row.client_id) ?? getDefaultClientStats(row.client_id);
    const total = current.total + Number(row.total_price ?? 0);
    const count = current.count + 1;
    const lastDate =
      !current.last_date || row.booking_date > current.last_date ? row.booking_date : current.last_date;

    statsByClient.set(row.client_id, {
      client_id: row.client_id,
      count,
      last_date: lastDate,
      total,
    });
  }

  return statsByClient;
}

export function buildClientWhatsAppUrl(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  const whatsappPhone = normalized.startsWith("55") ? normalized : `55${normalized}`;
  return `https://wa.me/${whatsappPhone}`;
}

export async function lookupClientByPhone(
  salonId: string,
  phone: string
): Promise<ClientLookup | null> {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 10) return null;

  const { data, error } = await untypedSupabase
    .from("clients")
    .select("id, preferred_name, phone_normalized")
    .eq("salon_id", salonId)
    .eq("phone_normalized", normalized)
    .is("merged_into_id", null)
    .maybeSingle();

  if (error) throw error;
  return (data as ClientLookup | null) ?? null;
}

export async function getClientsPage(
  salonId: string,
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<ClientsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await untypedSupabase
    .from("clients")
    .select("*")
    .eq("salon_id", salonId)
    .is("merged_into_id", null)
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) throw error;

  const clients = (data as ClientRecord[] | null) ?? [];
  const ids = clients.map((client) => client.id);

  if (ids.length === 0) {
    return {
      clients: [],
      hasMore: false,
      nextPage: undefined,
      page,
    };
  }

  const { data: bookingsData, error: bookingsError } = await untypedSupabase
    .from("bookings")
    .select("client_id, total_price, booking_date")
    .in("client_id", ids)
    .in("status", ["confirmed", "completed"]);

  if (bookingsError) throw bookingsError;

  const statsByClient = buildStatsMap((bookingsData as ClientBookingStatRow[] | null) ?? []);
  const enrichedClients = clients.map((client) => ({
    ...client,
    stats: statsByClient.get(client.id) ?? getDefaultClientStats(client.id),
  }));

  return {
    clients: enrichedClients,
    hasMore: clients.length === pageSize,
    nextPage: clients.length === pageSize ? page + 1 : undefined,
    page,
  };
}
