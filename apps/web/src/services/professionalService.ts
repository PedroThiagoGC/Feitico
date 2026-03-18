import { api } from "@/services/api";
import type {
  Professional,
  ProfessionalService,
  ProfessionalAvailability,
  ProfessionalException,
} from "@/hooks/useProfessionals";

export async function fetchProfessionals(salonId: string): Promise<Professional[]> {
  return api.getProfessionals(salonId) as Promise<Professional[]>;
}

export async function fetchProfessionalServices(
  professionalId: string
): Promise<ProfessionalService[]> {
  return api.getProfessionalServices(professionalId) as Promise<ProfessionalService[]>;
}

export async function fetchProfessionalAvailability(
  professionalId: string
): Promise<ProfessionalAvailability[]> {
  return api.getProfessionalAvailability(professionalId) as Promise<ProfessionalAvailability[]>;
}

export async function fetchProfessionalExceptions(
  professionalId: string,
  month?: string
): Promise<ProfessionalException[]> {
  return api.getProfessionalExceptions(professionalId, month) as Promise<ProfessionalException[]>;
}

export async function fetchProfessionalServiceLinks(serviceIds: string[]) {
  return api.getProfessionalServiceLinks(serviceIds) as Promise<
    { professional_id: string; service_id: string }[]
  >;
}
