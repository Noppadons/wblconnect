import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    // Log the actual exception for debugging
    console.error('AllExceptionsFilter caught:', exception);

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter
        ? httpAdapter.getRequestUrl(ctx.getRequest())
        : 'unknown',
      message:
        typeof message === 'object'
          ? (message as any).message || message
          : message,
    };

    if (httpAdapter) {
      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    } else {
      // Fallback for extreme cases where adapter is missing
      const response = ctx.getResponse();
      if (response.status && response.send) {
        response.status(httpStatus).send(responseBody);
      }
    }
  }
}
