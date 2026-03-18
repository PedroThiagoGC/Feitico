import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
} from "@nestjs/common";
import { TestimonialsService } from "./testimonials.service";

@Controller("testimonials")
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @HttpCode(200)
  async findAll(
    @Query("minRating") minRating?: string,
    @Query("salonId") salonId?: string,
  ) {
    const rating = minRating ? parseInt(minRating, 10) : undefined;
    return this.testimonialsService.findAll({ salonId, minRating: rating });
  }

  @Get(":id")
  @HttpCode(200)
  async findById(@Param("id") id: string) {
    return this.testimonialsService.findById(id);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() createTestimonialDto: any) {
    return this.testimonialsService.create(createTestimonialDto);
  }

  @Put(":id")
  @HttpCode(200)
  async update(@Param("id") id: string, @Body() updateTestimonialDto: any) {
    return this.testimonialsService.update(id, updateTestimonialDto);
  }

  @Delete(":id")
  @HttpCode(200)
  async delete(@Param("id") id: string) {
    return this.testimonialsService.delete(id);
  }
}
