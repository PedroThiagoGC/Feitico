import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createService,
  deleteService,
  getServices,
  saveService,
  updateService,
  type AdminServicePayload,
  type GetServicesOptions,
} from "@/services/servicesService";
import type { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export function useServices(salonId?: string, options?: GetServicesOptions) {
  return useQuery({
    queryKey: ["services", salonId, options?.includeInactive ?? false],
    queryFn: () => getServices(salonId!, options),
    enabled: !!salonId,
  });
}

export function useAdminServices(salonId?: string) {
  return useServices(salonId, { includeInactive: true });
}

export function useCreateServiceMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceInsert) => createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", salonId] });
    },
  });
}

export function useUpdateServiceMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceUpdate }) => updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", salonId] });
    },
  });
}

export function useDeleteServiceMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", salonId] });
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
    },
  });
}

export function useSaveServiceMutation(salonId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminServicePayload) => saveService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", salonId] });
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
    },
  });
}
