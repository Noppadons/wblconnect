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

        app.setGlobalPrefix('api');

        app.use(cookieParser());

        // Debugging middleware
        app.use((req: any, res: any, next: any) => {
            console.log(`[Vercel Bridge] Request: ${req.method} ${req.url}`);
            next();
        });

        // Security Hardening
        if (typeof helmet === 'function') {
            app.use(helmet({
                crossOriginResourcePolicy: { policy: "cross-origin" }
            }));
        }

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
    // Normalize URL for NestJS Global Prefix
    // If Vercel rewrites /api/foo to this function, req.url might be /foo or /api/foo
    // We want to ensure it looks like /api/foo for NestJS to match the prefix.
    if (req.url && !req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
    }

    const serverInstance = await bootstrap();
    serverInstance(req, res);
};
