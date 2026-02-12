import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class NoCacheInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const response = context.switchToHttp().getResponse<Response>();

        response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        response.setHeader('Pragma', 'no-cache');
        response.setHeader('Expires', '0');

        return next.handle();
    }
}
