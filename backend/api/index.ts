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
            logger: ['error', 'warn', 'log'],
        });

        // NOTE: We don't use setGlobalPrefix('api') here because Vercel handles the /api route mapping.
        // If the request is /api/auth/login, Vercel routes it here, and if we have 'api' prefix, 
        // Nest would look for /api/api/auth/login.

        app.use(cookieParser());

        // Debugging middleware
        app.use((req: any, res: any, next: any) => {
            console.log(`[Vercel Bridge] Request: ${req.method} ${req.url}`);
            next();
        });

        // Security Hardening
        app.use((helmet as any)({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        app.useGlobalInterceptors(new NoCacheInterceptor());

        app.enableCors({
            origin: true,
            credentials: true,
        });

        // Serve static files (Fallback)
        app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

        const httpAdapterHost = app.get(HttpAdapterHost);
        app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));

        await app.init();
        console.log('[Vercel Bridge] NestJS App Initialized');
    }
    return server;
}

export default async (req: any, res: any) => {
    const serverInstance = await bootstrap();
    serverInstance(req, res);
};
