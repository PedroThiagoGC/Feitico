import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GalleryImage } from "../../entities/gallery-image.entity";

@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    @InjectRepository(GalleryImage)
    private readonly galleryRepo: Repository<GalleryImage>,
  ) {}

  async findAll(salonId?: string) {
    try {
      const where: any = {};
      if (salonId) where.salonId = salonId;
      return await this.galleryRepo.find({ where, order: { sortOrder: "ASC" } });
    } catch (error) {
      this.logger.error("Error in findAll", error);
      return [];
    }
  }

  async findById(id: string) {
    return this.galleryRepo.findOneBy({ id });
  }

  async create(createData: Partial<GalleryImage>) {
    const image = this.galleryRepo.create(createData);
    return this.galleryRepo.save(image);
  }

  async update(id: string, updateData: Partial<GalleryImage>) {
    await this.galleryRepo.update(id, updateData);
    return this.galleryRepo.findOneBy({ id });
  }

  async delete(id: string) {
    await this.galleryRepo.delete(id);
    return { success: true };
  }
}
