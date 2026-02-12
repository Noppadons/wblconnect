import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import * as helmetModule from 'helmet';
import * as expressModule from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { NoCacheInterceptor } from '../src/common/interceptors/no-cache.interceptor.js';
import { ExpressAdapter } from '@nestjs/platform-express';

// Robust import resolution for CommonJS modules in nodenext
const express = (expressModule as any).default || expressModule;
const helmet = (helmetModule as any).default || helmetModule;

const server = express();

let app: any;

async function bootstrap() {
    console.log('--- VERCEL BACKEND BOOTSTRAP START ---');
    if (!app) {
        try {
            app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
                rawBody: true,
            });

            app.setGlobalPrefix('api');
            app.use(cookieParser());

            // Security Hardening
            if (typeof helmet === 'function') {
                app.use(helmet({
                    crossOriginResourcePolicy: { policy: "cross-origin" }
                }));
            } else if (helmet && (helmet as any).default) {
                app.use((helmet as any).default({
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
            console.log('--- VERCEL BACKEND BOOTSTRAP SUCCESS ---');
        } catch (err: any) {
            console.error('--- VERCEL BACKEND BOOTSTRAP FAILED ---');
            console.error(err);
            throw err;
        }
    }
    return server;
}

export default async (req: any, res: any) => {
    try {
        const serverInstance = await bootstrap();
        serverInstance(req, res);
    } catch (err: any) {
        console.error('SERVERLESS FUNCTION CRASH:', err.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
