import { RequestHandler } from 'express';
import redisStore from '../services/redis-store';

export const ERROR_CODE = 'rate_limit_reached';

const rateLimiterMiddleware: RequestHandler = async (request, response, next) => {
  const ip = (request.headers['x-forwarded-for'] ?? request.socket.remoteAddress) as string;
  const attempts = await redisStore.attempts(ip);
  const availableAt = await redisStore.availableAt(ip);
  // TODO: Move to an env variable
  const maxAttempts = 100;

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

const tooManyAttempts = (attempts: number, maxAttempts: number) => {
  return attempts >= maxAttempts;
};

export default rateLimiterMiddleware;
