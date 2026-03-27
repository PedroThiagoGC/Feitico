import { useInfiniteQuery } from "@tanstack/react-query";
import { getClientsPage, type ClientListItem } from "@/services/clientService";

export type Client = ClientListItem;

export function useInfiniteClients(salonId?: string) {
  return useInfiniteQuery({
    queryKey: ["clients", salonId],
    queryFn: ({ pageParam }) => getClientsPage(salonId!, pageParam as number),
    enabled: !!salonId,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}
