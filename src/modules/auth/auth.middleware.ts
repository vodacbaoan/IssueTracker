import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import { ACCESS_TOKEN_COOKIE_NAME, readCookie, tryVerifyAccessToken } from './auth.tokens';

export function createAuthContextMiddleware(config: AppConfig): RequestHandler {
  return async (request, _response, next) => {
    const accessToken = readCookie(request.headers.cookie, ACCESS_TOKEN_COOKIE_NAME);

    if (!accessToken) {
      next();
      return;
    }

    const payload = await tryVerifyAccessToken(accessToken, config);

    if (payload) {
      request.auth = {
        userId: payload.userId,
      };
    }

    next();
  };
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  if (!request.auth?.userId) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  next();
};
