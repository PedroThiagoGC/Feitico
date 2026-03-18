import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  async onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!url || !key) {
      this.logger.error("Missing Supabase credentials");
      throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
    }

    this.supabaseClient = createClient(url, key);
    this.logger.log("Supabase client initialized");
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  async query(table: string, options?: any) {
    return this.supabaseClient.from(table).select("*", options);
  }

  async findById(table: string, id: string) {
    return this.supabaseClient.from(table).select().eq("id", id).single();
  }

  async create(table: string, data: any) {
    return this.supabaseClient.from(table).insert([data]).select().single();
  }

  async update(table: string, id: string, data: any) {
    return this.supabaseClient
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();
  }

  async delete(table: string, id: string) {
    return this.supabaseClient.from(table).delete().eq("id", id);
  }
}
