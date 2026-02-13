import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmetModule from 'helmet';
import express from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { NoCacheInterceptor } from '../src/common/interceptors/no-cache.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';

const helmet = (helmetModule as any).default || helmetModule;
const server = express();

let app: any;

async function bootstrap() {
    if (!app) {
        app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
            rawBody: true,
            logger: ['error', 'warn', 'log'],
        });

        // NOTE: We REMOVED setGlobalPrefix('api') here to make the bridge prefix-agnostic.
        // We will normalize the URL in the export handler instead.

        app.use(cookieParser());

        // Security Hardening
        if (typeof helmet === 'function') {
            app.use(helmet({
                crossOriginResourcePolicy: { policy: "cross-origin" }
            }));
        }

        app.useGlobalInterceptors(new NoCacheInterceptor());

        app.enableCors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
    }
    return server;
}

export default async (req: any, res: any) => {
    // Normalize URL for NestJS
    // We want to STRIP '/api' because NestJS routes are defined without it (since we removed the prefix)
    if (req.url && req.url.startsWith('/api')) {
        req.url = req.url.replace(/^\/api/, '');
        if (!req.url.startsWith('/')) req.url = '/' + req.url;
    }

    const serverInstance = await bootstrap();
    serverInstance(req, res);
};
