import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { NoCacheInterceptor } from '../src/common/interceptors/no-cache.interceptor.js';
import { ExpressAdapter } from '@nestjs/platform-express';

const server = express();

let app: any;

async function bootstrap() {
    if (!app) {
        app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
            rawBody: true,
        });

        app.setGlobalPrefix('api');
        app.use(cookieParser());

        // Security Hardening - use any/ignore to bypass strict nodenext/type issues
        // @ts-ignore
        app.use((helmet as any)({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        app.useGlobalInterceptors(new NoCacheInterceptor());

        app.enableCors({
            origin: true,
            credentials: true,
        });

        // Serve static files from uploads folder
        app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

        const httpAdapterHost = app.get(HttpAdapterHost);
        app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

        // Enable Global Validation Pipe
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));

        await app.init();
    }
    return server;
}

export default async (req: any, res: any) => {
    const serverInstance = await bootstrap();
    serverInstance(req, res);
};
