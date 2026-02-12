import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

let cachedApp: any;

export default async function handler(req: any, res: any) {
    if (!cachedApp) {
        const app = await NestFactory.create(AppModule, {
            rawBody: true,
        });

        app.setGlobalPrefix('api');
        app.use(cookieParser());
        app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        app.enableCors({
            origin: true,
            credentials: true,
        });

        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));

        await app.init();
        cachedApp = app.getHttpAdapter().getInstance();
    }

    return cachedApp(req, res);
}
