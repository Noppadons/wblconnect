import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { NoCacheInterceptor } from './common/interceptors/no-cache.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  // STARTUP VALIDATION: Ensure critical env vars are set
  const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'];
  const missingEnv = requiredEnv.filter((env) => !process.env[env]);

  if (missingEnv.length > 0) {
    console.error(
      `❌ CRITICAL ERROR: Missing environment variables: ${missingEnv.join(', ')}`,
    );
    process.exit(1);
  }

  app.use(cookieParser());

  // Security Hardening - Adjusted for static file serving
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.useGlobalInterceptors(new NoCacheInterceptor());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Serve static files from uploads folder
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Stripe away properties not in DTO
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
    }),
  );

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
