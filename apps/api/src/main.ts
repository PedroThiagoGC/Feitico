import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 3333;

  // Detect if running on Vercel
  if (process.env.VERCEL === '1') {
    // Vercel serverless - export handler
    const handler = app.getHttpServer();
    module.exports = handler;
    console.log('🚀 API running on Vercel (serverless)');
  } else {
    // Local development
    await app.listen(port, () => {
      console.log(`🚀 API running on http://localhost:${port}`);
    });
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
