import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SalonsController } from "./salons.controller";
import { SalonsService } from "./salons.service";
import { Salon } from "../../entities/salon.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Salon])],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
