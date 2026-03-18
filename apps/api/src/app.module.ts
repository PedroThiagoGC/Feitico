import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ServicesModule } from './modules/services/services.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { AuthModule } from './modules/auth/auth.module';
import { SalonsModule } from './modules/salons/salons.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    BookingsModule,
    ProfessionalsModule,
    ServicesModule,
    GalleryModule,
    TestimonialsModule,
    AuthModule,
    SalonsModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
