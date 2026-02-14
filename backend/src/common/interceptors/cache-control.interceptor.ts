import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

export const CACHE_TTL_KEY = 'cache_ttl';

/**
 * Custom decorator to set Cache-Control max-age on specific endpoints.
 * Usage: @CacheTTL(60) // 60 seconds
 */
export function CacheTTL(seconds: number): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(CACHE_TTL_KEY, seconds, descriptor.value as object);
    return descriptor;
  };
}

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler());

    if (ttl && ttl > 0) {
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader('Cache-Control', `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`);
    }

    return next.handle();
  }
}
