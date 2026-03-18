import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Professional } from "../../entities/professional.entity";
import { ProfessionalService } from "../../entities/professional-service.entity";
import { ProfessionalAvailability } from "../../entities/professional-availability.entity";
import { ProfessionalException } from "../../entities/professional-exception.entity";

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    @InjectRepository(Professional)
    private readonly professionalRepo: Repository<Professional>,
    @InjectRepository(ProfessionalService)
    private readonly professionalServiceRepo: Repository<ProfessionalService>,
    @InjectRepository(ProfessionalAvailability)
    private readonly availabilityRepo: Repository<ProfessionalAvailability>,
    @InjectRepository(ProfessionalException)
    private readonly exceptionRepo: Repository<ProfessionalException>,
  ) {}

  async findAll(salonId?: string) {
    try {
      const where: any = { active: true };
      if (salonId) where.salonId = salonId;
      return await this.professionalRepo.find({
        where,
        order: { name: "ASC" },
      });
    } catch (error) {
      this.logger.error("Error in findAll", error);
      return [];
    }
  }

  async findById(id: string) {
    try {
      const professional = await this.professionalRepo.findOneBy({ id });
      if (!professional) throw new NotFoundException("Professional not found");
      return professional;
    } catch (error) {
      this.logger.error(`Error finding professional ${id}`, error);
      throw error;
    }
  }

  async create(createData: Partial<Professional>) {
    try {
      const professional = this.professionalRepo.create(createData);
      return await this.professionalRepo.save(professional);
    } catch (error) {
      this.logger.error("Error creating professional", error);
      throw error;
    }
  }

  async update(id: string, updateData: Partial<Professional>) {
    try {
      await this.professionalRepo.update(id, updateData);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating professional ${id}`, error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      await this.professionalRepo.update(id, { active: false });
      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting professional ${id}`, error);
      throw error;
    }
  }

  // ── Professional Services (N:N) ───────────────────────────────────────────

  async findServices(professionalId: string) {
    return this.professionalServiceRepo.find({
      where: { professionalId, active: true },
      relations: ["service"],
    });
  }

  async findServiceLinks(serviceIds: string[]) {
    if (!serviceIds.length) return [];
    return this.professionalServiceRepo
      .createQueryBuilder("ps")
      .where("ps.serviceId IN (:...serviceIds)", { serviceIds })
      .andWhere("ps.active = true")
      .select(["ps.professionalId", "ps.serviceId"])
      .getMany();
  }

  async createServiceLink(
    professionalId: string,
    payload: Partial<ProfessionalService>,
  ) {
    const link = this.professionalServiceRepo.create({
      professionalId,
      ...payload,
    });
    return this.professionalServiceRepo.save(link);
  }

  async updateServiceLink(
    linkId: string,
    payload: Partial<ProfessionalService>,
  ) {
    await this.professionalServiceRepo.update(linkId, payload);
    const updated = await this.professionalServiceRepo.findOneBy({
      id: linkId,
    });
    if (!updated)
      throw new NotFoundException("Professional service link not found");
    return updated;
  }

  async deleteServiceLink(linkId: string) {
    const result = await this.professionalServiceRepo.delete(linkId);
    if (!result.affected)
      throw new NotFoundException("Professional service link not found");
    return { success: true };
  }

  // ── Professional Availability ─────────────────────────────────────────────

  async findAvailability(professionalId: string) {
    return this.availabilityRepo.find({
      where: { professionalId },
      order: { weekday: "ASC" },
    });
  }

  async createAvailability(
    professionalId: string,
    payload: Partial<ProfessionalAvailability>,
  ) {
    const avail = this.availabilityRepo.create({ professionalId, ...payload });
    return this.availabilityRepo.save(avail);
  }

  async updateAvailability(
    availabilityId: string,
    payload: Partial<ProfessionalAvailability>,
  ) {
    await this.availabilityRepo.update(availabilityId, payload);
    const updated = await this.availabilityRepo.findOneBy({
      id: availabilityId,
    });
    if (!updated)
      throw new NotFoundException("Professional availability not found");
    return updated;
  }

  async deleteAvailability(availabilityId: string) {
    const result = await this.availabilityRepo.delete(availabilityId);
    if (!result.affected)
      throw new NotFoundException("Professional availability not found");
    return { success: true };
  }

  // ── Professional Exceptions ───────────────────────────────────────────────

  async findExceptions(professionalId: string, month?: string) {
    const qb = this.exceptionRepo
      .createQueryBuilder("e")
      .where("e.professionalId = :professionalId", { professionalId })
      .orderBy("e.date", "ASC");

    if (month) {
      qb.andWhere("e.date >= :start AND e.date <= :end", {
        start: `${month}-01`,
        end: `${month}-31`,
      });
    }

    return qb.getMany();
  }

  async createException(
    professionalId: string,
    payload: Partial<ProfessionalException>,
  ) {
    const exc = this.exceptionRepo.create({ professionalId, ...payload });
    return this.exceptionRepo.save(exc);
  }

  async updateException(
    exceptionId: string,
    payload: Partial<ProfessionalException>,
  ) {
    await this.exceptionRepo.update(exceptionId, payload);
    const updated = await this.exceptionRepo.findOneBy({ id: exceptionId });
    if (!updated)
      throw new NotFoundException("Professional exception not found");
    return updated;
  }

  async deleteException(exceptionId: string) {
    const result = await this.exceptionRepo.delete(exceptionId);
    if (!result.affected)
      throw new NotFoundException("Professional exception not found");
    return { success: true };
  }
}
