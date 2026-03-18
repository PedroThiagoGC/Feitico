import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Service } from "../../entities/service.entity";

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async findAll(salonId?: string) {
    try {
      const where: any = { active: true };
      if (salonId) where.salonId = salonId;
      return await this.serviceRepo.find({ where, order: { sortOrder: "ASC" } });
    } catch (error) {
      this.logger.error("Error in findAll", error);
      return [];
    }
  }

  async findById(id: string) {
    return this.serviceRepo.findOneBy({ id });
  }

  async create(createData: Partial<Service>) {
    const service = this.serviceRepo.create(createData);
    return this.serviceRepo.save(service);
  }

  async update(id: string, updateData: Partial<Service>) {
    await this.serviceRepo.update(id, updateData);
    return this.serviceRepo.findOneBy({ id });
  }

  async delete(id: string) {
    await this.serviceRepo.update(id, { active: false });
    return { success: true };
  }
}
