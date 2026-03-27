import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProfessional,
  createProfessionalAvailability,
  createProfessionalException,
  createProfessionalServiceLink,
  deleteProfessional,
  deleteProfessionalAvailability,
  deleteProfessionalException,
  deleteProfessionalServiceLink,
  getAvailabilityForProfessionals,
  getProfessionalAvailability,
  getProfessionalExceptions,
  getProfessionals,
  getProfessionalServices,
  updateProfessional,
  updateProfessionalAvailability,
  updateProfessionalServiceLink,
  type GetProfessionalAvailabilityOptions,
  type GetProfessionalExceptionsOptions,
  type GetProfessionalsOptions,
  type GetProfessionalServicesOptions,
} from "@/services/professionalService";
import type { Database } from "@/integrations/supabase/types";

export type Professional = Database["public"]["Tables"]["professionals"]["Row"];
export type ProfessionalInsert = Database["public"]["Tables"]["professionals"]["Insert"];
export type ProfessionalUpdate = Database["public"]["Tables"]["professionals"]["Update"];
export type ProfessionalService = Database["public"]["Tables"]["professional_services"]["Row"];
export type ProfessionalServiceInsert = Database["public"]["Tables"]["professional_services"]["Insert"];
export type ProfessionalServiceUpdate = Database["public"]["Tables"]["professional_services"]["Update"];
export type ProfessionalAvailability = Database["public"]["Tables"]["professional_availability"]["Row"];
export type ProfessionalAvailabilityInsert = Database["public"]["Tables"]["professional_availability"]["Insert"];
export type ProfessionalAvailabilityUpdate = Database["public"]["Tables"]["professional_availability"]["Update"];
export type ProfessionalException = Database["public"]["Tables"]["professional_exceptions"]["Row"];
export type ProfessionalExceptionInsert = Database["public"]["Tables"]["professional_exceptions"]["Insert"];

export function useProfessionals(salonId?: string, options?: GetProfessionalsOptions) {
  return useQuery({
    queryKey: ["professionals", salonId, options?.includeInactive ?? false],
    queryFn: () => getProfessionals(salonId!, options),
    enabled: !!salonId,
  });
}

export function useCreateProfessionalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfessionalInsert) => createProfessional(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}

export function useUpdateProfessionalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProfessionalUpdate }) => updateProfessional(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
  });
}

export function useDeleteProfessionalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProfessional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["professional-availability"] });
      queryClient.invalidateQueries({ queryKey: ["professional-exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useProfessionalServices(professionalId?: string, options?: GetProfessionalServicesOptions) {
  return useQuery({
    queryKey: ["professional-services", professionalId, options?.activeOnly ?? true],
    queryFn: () => getProfessionalServices(professionalId!, options),
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalServiceLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfessionalServiceInsert) => createProfessionalServiceLink(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
    },
  });
}

export function useUpdateProfessionalServiceLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProfessionalServiceUpdate }) => updateProfessionalServiceLink(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
    },
  });
}

export function useDeleteProfessionalServiceLinkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProfessionalServiceLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-services"] });
    },
  });
}

export function useProfessionalAvailability(professionalId?: string, options?: GetProfessionalAvailabilityOptions) {
  return useQuery({
    queryKey: ["professional-availability", professionalId, options?.includeInactive ?? false],
    queryFn: () => getProfessionalAvailability(professionalId!, options),
    enabled: !!professionalId,
  });
}

export function useAvailabilityForProfessionals(
  professionalIds: string[],
  options?: GetProfessionalAvailabilityOptions
) {
  return useQuery({
    queryKey: ["professional-availability-batch", professionalIds, options?.includeInactive ?? false],
    queryFn: () => getAvailabilityForProfessionals(professionalIds, options),
    enabled: professionalIds.length > 0,
  });
}

export function useCreateProfessionalAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfessionalAvailabilityInsert) => createProfessionalAvailability(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability"] });
    },
  });
}

export function useUpdateProfessionalAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProfessionalAvailabilityUpdate }) => updateProfessionalAvailability(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability"] });
    },
  });
}

export function useDeleteProfessionalAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProfessionalAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-availability"] });
    },
  });
}

export function useProfessionalExceptions(
  professionalId?: string,
  options?: GetProfessionalExceptionsOptions | string
) {
  const monthKey = typeof options === "string" ? options : options?.month;
  const futureOnly = typeof options === "string" ? false : options?.futureOnly ?? false;

  return useQuery({
    queryKey: ["professional-exceptions", professionalId, monthKey, futureOnly],
    queryFn: () => getProfessionalExceptions(professionalId!, options),
    enabled: !!professionalId,
  });
}

export function useCreateProfessionalExceptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfessionalExceptionInsert) => createProfessionalException(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-exceptions"] });
    },
  });
}

export function useDeleteProfessionalExceptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProfessionalException(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professional-exceptions"] });
    },
  });
}
