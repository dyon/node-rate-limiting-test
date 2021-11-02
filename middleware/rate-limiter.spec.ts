import { Request, Response } from 'express';
import redisStore from '../services/redis-store';
import rateLimiterMiddleware, { ERROR_CODE } from './rate-limiter';
import { mocked } from 'ts-jest/utils';

jest.mock('../services/redis-store', () => ({
  hit: jest.fn(),
  attempts: jest.fn(),
  availableAt: jest.fn(),
}));

const mockedRedisStore = mocked(redisStore, true);

describe('Rate limiter middleware', () => {
  const requestForIp = (ip: string = '1.2.3.4') => ({
    headers: {
      'x-forwarded-for': ip,
    } as any,
  } as Request);
  const response = {} as Response;
  const next = jest.fn();

  it('adds a hit when the middleware gets called', async () => {
    await rateLimiterMiddleware(requestForIp(), response, next);

    expect(redisStore.hit).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('sets an error when a user has exceeded the rate limit', async () => {
    mockedRedisStore.attempts.mockResolvedValue(101);
    mockedRedisStore.availableAt.mockResolvedValue(2000000000);

    await rateLimiterMiddleware(requestForIp(), response, next);

    expect(next).toHaveBeenCalledWith({
      code: ERROR_CODE,
      attempts: 101,
      availableAt: 2000000000,
    });
  });
});
