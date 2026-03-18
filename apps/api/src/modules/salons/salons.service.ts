import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../../services/supabase.service";

@Injectable()
export class SalonsService {
  private readonly logger = new Logger(SalonsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findCurrent() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from("salons")
        .select("*")
        .eq("active", true)
        .limit(1)
        .single();

      if (error || !data) {
        throw new NotFoundException("Active salon not found");
      }

      return data;
    } catch (error) {
      this.logger.error("Error loading current salon", error);
      throw error;
    }
  }

  async findById(id: string) {
    const { data, error } = await this.supabaseService.findById("salons", id);

    if (error || !data) {
      throw new NotFoundException("Salon not found");
    }

    return data;
  }

  async create(createData: Record<string, unknown>) {
    const payload = {
      ...createData,
      active: true,
    };

    const { data, error } = await this.supabaseService.create(
      "salons",
      payload,
    );

    if (error || !data) {
      throw new NotFoundException("Failed to create salon");
    }

    return data;
  }

  async update(id: string, updateData: Record<string, unknown>) {
    const { data, error } = await this.supabaseService.update("salons", id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });

    if (error || !data) {
      throw new NotFoundException("Failed to update salon");
    }

    return data;
  }
}
