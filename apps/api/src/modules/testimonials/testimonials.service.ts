import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Testimonial } from "../../entities/testimonial.entity";

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    @InjectRepository(Testimonial)
    private readonly testimonialRepo: Repository<Testimonial>,
  ) {}

  async findAll(filters?: { salonId?: string; minRating?: number }) {
    try {
      const qb = this.testimonialRepo
        .createQueryBuilder("t")
        .where("t.active = true")
        .orderBy("t.createdAt", "DESC");

      if (filters?.salonId) qb.andWhere("t.salonId = :salonId", { salonId: filters.salonId });
      if (filters?.minRating) qb.andWhere("t.rating >= :min", { min: filters.minRating });

      return await qb.getMany();
    } catch (error) {
      this.logger.error("Error in findAll", error);
      return [];
    }
  }

  async findById(id: string) {
    return this.testimonialRepo.findOneBy({ id });
  }

  async create(createData: Partial<Testimonial>) {
    const testimonial = this.testimonialRepo.create(createData);
    return this.testimonialRepo.save(testimonial);
  }

  async update(id: string, updateData: Partial<Testimonial>) {
    await this.testimonialRepo.update(id, updateData);
    return this.testimonialRepo.findOneBy({ id });
  }

  async delete(id: string) {
    await this.testimonialRepo.update(id, { active: false });
    return { success: true };
  }
}
