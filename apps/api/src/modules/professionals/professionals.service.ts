import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../../services/supabase.service";

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(salonId?: string) {
    try {
      let query = this.supabaseService
        .getClient()
        .from("professionals")
        .select("*")
        .eq("active", true);

      if (salonId) {
        query = query.eq("salon_id", salonId);
      }

      const { data, error } = await query.order("name");

      if (error) {
        this.logger.error("Failed to fetch professionals", error);
        return [];
      }

      return data || [];
    } catch (error) {
      this.logger.error("Error in findAll", error);
      return [];
    }
  }

  async findById(id: string) {
    try {
      const { data, error } = await this.supabaseService.findById(
        "professionals",
        id,
      );

      if (error || !data) {
        throw new NotFoundException("Professional not found");
      }

      return data;
    } catch (error) {
      this.logger.error(`Error finding professional ${id}`, error);
      throw error;
    }
  }

  async create(createData: any) {
    try {
      const { data, error } = await this.supabaseService.create(
        "professionals",
        createData,
      );

      if (error) {
        this.logger.error("Failed to create professional", error);
        throw new Error("Failed to create professional");
      }

      return data;
    } catch (error) {
      this.logger.error("Error creating professional", error);
      throw error;
    }
  }

  async update(id: string, updateData: any) {
    try {
      const { data, error } = await this.supabaseService.update(
        "professionals",
        id,
        updateData,
      );

      if (error || !data) {
        throw new NotFoundException("Professional not found");
      }

      return data;
    } catch (error) {
      this.logger.error(`Error updating professional ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.supabaseService.update("professionals", id, { active: false });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting professional ${id}`, error);
      throw error;
    }
  }

  async findServices(professionalId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_services")
      .select("*")
      .eq("professional_id", professionalId)
      .eq("active", true);

    if (error) {
      this.logger.error(
        `Error loading services for professional ${professionalId}`,
        error,
      );
      throw new NotFoundException("Professional services not found");
    }

    return data || [];
  }

  async findAvailability(professionalId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_availability")
      .select("*")
      .eq("professional_id", professionalId)
      .order("weekday");

    if (error) {
      this.logger.error(
        `Error loading availability for professional ${professionalId}`,
        error,
      );
      throw new NotFoundException("Professional availability not found");
    }

    return data || [];
  }

  async createAvailability(professionalId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_availability")
      .insert({
        professional_id: professionalId,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Error creating availability for professional ${professionalId}`,
        error,
      );
      throw new Error("Failed to create professional availability");
    }

    return data;
  }

  async updateAvailability(availabilityId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_availability")
      .update(payload)
      .eq("id", availabilityId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating availability ${availabilityId}`, error);
      throw new NotFoundException("Professional availability not found");
    }

    return data;
  }

  async deleteAvailability(availabilityId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from("professional_availability")
      .delete()
      .eq("id", availabilityId);

    if (error) {
      this.logger.error(`Error deleting availability ${availabilityId}`, error);
      throw new NotFoundException("Professional availability not found");
    }

    return { success: true };
  }

  async findExceptions(professionalId: string, month?: string) {
    let query = this.supabaseService
      .getClient()
      .from("professional_exceptions")
      .select("*")
      .eq("professional_id", professionalId)
      .order("date");

    if (month) {
      query = query.gte("date", `${month}-01`).lte("date", `${month}-31`);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(
        `Error loading exceptions for professional ${professionalId}`,
        error,
      );
      throw new NotFoundException("Professional exceptions not found");
    }

    return data || [];
  }

  async createException(professionalId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_exceptions")
      .insert({
        professional_id: professionalId,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Error creating exception for professional ${professionalId}`,
        error,
      );
      throw new Error("Failed to create professional exception");
    }

    return data;
  }

  async updateException(exceptionId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_exceptions")
      .update(payload)
      .eq("id", exceptionId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating exception ${exceptionId}`, error);
      throw new NotFoundException("Professional exception not found");
    }

    return data;
  }

  async deleteException(exceptionId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from("professional_exceptions")
      .delete()
      .eq("id", exceptionId);

    if (error) {
      this.logger.error(`Error deleting exception ${exceptionId}`, error);
      throw new NotFoundException("Professional exception not found");
    }

    return { success: true };
  }

  async findServiceLinks(serviceIds: string[]) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_services")
      .select("professional_id, service_id")
      .in("service_id", serviceIds)
      .eq("active", true);

    if (error) {
      this.logger.error("Error loading professional service links", error);
      return [];
    }

    return data || [];
  }

  async createServiceLink(professionalId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_services")
      .insert({
        professional_id: professionalId,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Error creating service link for professional ${professionalId}`,
        error,
      );
      throw new Error("Failed to create professional service link");
    }

    return data;
  }

  async updateServiceLink(linkId: string, payload: any) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from("professional_services")
      .update(payload)
      .eq("id", linkId)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Error updating service link ${linkId}`, error);
      throw new NotFoundException("Professional service link not found");
    }

    return data;
  }

  async deleteServiceLink(linkId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from("professional_services")
      .delete()
      .eq("id", linkId);

    if (error) {
      this.logger.error(`Error deleting service link ${linkId}`, error);
      throw new NotFoundException("Professional service link not found");
    }

    return { success: true };
  }
}
