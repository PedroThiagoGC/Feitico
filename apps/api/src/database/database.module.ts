import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Salon } from "../entities/salon.entity";
import { Service } from "../entities/service.entity";
import { Booking } from "../entities/booking.entity";
import { Professional } from "../entities/professional.entity";
import { ProfessionalService } from "../entities/professional-service.entity";
import { ProfessionalAvailability } from "../entities/professional-availability.entity";
import { ProfessionalException } from "../entities/professional-exception.entity";
import { GalleryImage } from "../entities/gallery-image.entity";
import { Testimonial } from "../entities/testimonial.entity";
import { Availability } from "../entities/availability.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres",
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT ?? "6543", 10),
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME ?? "postgres",
        ssl:
          process.env.DATABASE_SSLMODE === "require"
            ? { rejectUnauthorized: false }
            : false,
        entities: [
          Salon,
          Service,
          Booking,
          Professional,
          ProfessionalService,
          ProfessionalAvailability,
          ProfessionalException,
          GalleryImage,
          Testimonial,
          Availability,
        ],
        // Nunca alterar schema em produção automaticamente
        synchronize: false,
        logging: process.env.NODE_ENV !== "production",
      }),
    }),
  ],
})
export class DatabaseModule {}
