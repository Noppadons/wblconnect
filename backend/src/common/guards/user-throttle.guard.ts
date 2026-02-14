import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttle guard that uses authenticated user ID for rate limiting
 * instead of IP address. Falls back to IP for unauthenticated requests.
 * This prevents a single user from abusing the API while allowing
 * multiple users behind the same IP (e.g. school network) to work normally.
 */
@Injectable()
export class UserThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise fall back to IP
    return req.user?.id || req.ip || 'anonymous';
  }

  protected getRequestResponse(context: ExecutionContext) {
    const ctx = context.switchToHttp();
    return { req: ctx.getRequest(), res: ctx.getResponse() };
  }
}
