import { Module } from "@nestjs/common";
import { SalonsController } from "./salons.controller";
import { SalonsService } from "./salons.service";
import { SupabaseService } from "../../services/supabase.service";

@Module({
  controllers: [SalonsController],
  providers: [SalonsService, SupabaseService],
  exports: [SalonsService],
})
export class SalonsModule {}
