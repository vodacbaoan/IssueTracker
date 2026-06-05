import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import { createAuthContextMiddleware, requireAuth } from './auth.middleware';
import { ACCESS_TOKEN_COOKIE_NAME, createAccessToken } from './auth.tokens';

const config: AppConfig = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: 3000,
  DATABASE_URL: 'postgresql://user:password@localhost:5432/test',
  FRONTEND_ORIGIN: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'access-secret-for-tests',
  JWT_REFRESH_SECRET: 'refresh-secret-for-tests',
  ACCESS_TOKEN_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 7,
};

const response = {} as Response;

describe('createAuthContextMiddleware', () => {
  it('continues without auth when no access token cookie exists', async () => {
    const request = { headers: {} } as Request;
    const next = vi.fn() as NextFunction;
    const middleware = createAuthContextMiddleware(config);

    await middleware(request, response, next);

    expect(request.auth).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it('sets request auth when the access token is valid', async () => {
    const accessToken = await createAccessToken('user-1', config);
    const request = {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(accessToken)}`,
      },
    } as Request;
    const next = vi.fn() as NextFunction;
    const middleware = createAuthContextMiddleware(config);

    await middleware(request, response, next);

    expect(request.auth).toEqual({ userId: 'user-1' });
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('requireAuth', () => {
  it('passes an UnauthorizedError when request auth is missing', () => {
    const request = {} as Request;
    const next = vi.fn() as NextFunction;

    requireAuth(request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('continues when request auth exists', () => {
    const request = { auth: { userId: 'user-1' } } as Request;
    const next = vi.fn() as NextFunction;

    requireAuth(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });
});
