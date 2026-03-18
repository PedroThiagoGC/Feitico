import { Module } from "@nestjs/common";
import { ServicesController } from "./services.controller";
import { ServicesService } from "./services.service";
import { SupabaseService } from "../../services/supabase.service";

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, SupabaseService],
  exports: [ServicesService],
})
export class ServicesModule {}
