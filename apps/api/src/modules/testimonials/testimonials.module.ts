import { Module } from "@nestjs/common";
import { TestimonialsController } from "./testimonials.controller";
import { TestimonialsService } from "./testimonials.service";
import { SupabaseService } from "../../services/supabase.service";

@Module({
  controllers: [TestimonialsController],
  providers: [TestimonialsService, SupabaseService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
