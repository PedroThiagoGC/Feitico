import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfessionalsController } from "./professionals.controller";
import { ProfessionalsService } from "./professionals.service";
import { Professional } from "../../entities/professional.entity";
import { ProfessionalService } from "../../entities/professional-service.entity";
import { ProfessionalAvailability } from "../../entities/professional-availability.entity";
import { ProfessionalException } from "../../entities/professional-exception.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Professional,
      ProfessionalService,
      ProfessionalAvailability,
      ProfessionalException,
    ]),
  ],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
