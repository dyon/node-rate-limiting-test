import { RequestHandler } from 'express';
import redisStore from '../services/redis-store';

export const ERROR_CODE = 'rate_limit_reached';

export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
};

const rateLimiterMiddleware: RequestHandler = async (request, response, next) => {
  const ip = (request.headers['x-forwarded-for'] ?? request.socket.remoteAddress) as string;
  const attempts = await redisStore.attempts(ip);
  const availableAt = await redisStore.availableAt(ip);
  // TODO: Move to an env variable
  const maxAttempts = 100;

  // Set X-RateLimit-* headers
  response.set(rateLimitHeaders(attempts, maxAttempts, availableAt));

  if (tooManyAttempts(attempts, maxAttempts)) {
    next({
      code: ERROR_CODE,
      attempts,
      availableAt,
    });
  } else {
    await redisStore.hit(ip);
    next();
  }
};

const tooManyAttempts = (attempts: number, maxAttempts: number): boolean => {
  return attempts >= maxAttempts;
};

const remainingAttempts = (attempts: number, maxAttempts: number): number => {
  const remaining = maxAttempts - attempts;

  return remaining > 0
    ? remaining
    : 0;
};

const rateLimitHeaders = (attempts: number, maxAttempts: number, availableAt: number): RateLimitHeaders => ({
  'X-RateLimit-Limit': maxAttempts,
  'X-RateLimit-Remaining': remainingAttempts(attempts, maxAttempts),
  'X-RateLimit-Reset': availableAt,
});

export default rateLimiterMiddleware;
