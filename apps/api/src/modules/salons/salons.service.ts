import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Salon } from "../../entities/salon.entity";

@Injectable()
export class SalonsService {
  private readonly logger = new Logger(SalonsService.name);

  constructor(
    @InjectRepository(Salon)
    private readonly salonRepo: Repository<Salon>,
  ) {}

  async findCurrent() {
    try {
      const salon = await this.salonRepo.findOne({ where: { active: true } });
      if (!salon) throw new NotFoundException("Active salon not found");
      return salon;
    } catch (error) {
      this.logger.error("Error loading current salon", error);
      throw error;
    }
  }

  async findById(id: string) {
    const salon = await this.salonRepo.findOneBy({ id });
    if (!salon) throw new NotFoundException("Salon not found");
    return salon;
  }

  async create(createData: Partial<Salon>) {
    const salon = this.salonRepo.create({ ...createData, active: true });
    return this.salonRepo.save(salon);
  }

  async update(id: string, updateData: Partial<Salon>) {
    await this.salonRepo.update(id, updateData);
    return this.findById(id);
  }
}
