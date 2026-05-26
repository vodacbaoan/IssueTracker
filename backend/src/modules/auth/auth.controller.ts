import type { NextFunction, Request, Response } from 'express';
import type { AppConfig } from '../../config/env';
import { UnauthorizedError } from '../../lib/errors';
import type { LoginBody, SignupBody } from './auth.schema';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  readCookie,
  setAuthCookies,
} from './auth.tokens';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfig,
  ) {}

  signup = async (
    request: Request<unknown, unknown, SignupBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const session = await this.authService.signup(request.body);
      setAuthCookies(response, this.config, session);
      response.status(201).json({ user: session.user });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    request: Request<unknown, unknown, LoginBody>,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const session = await this.authService.login(request.body);
      setAuthCookies(response, this.config, session);
      response.json({ user: session.user });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE_NAME);

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token missing');
      }

      const session = await this.authService.refresh(refreshToken);
      setAuthCookies(response, this.config, session);
      response.json({ user: session.user });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = readCookie(request.headers.cookie, REFRESH_TOKEN_COOKIE_NAME);
      await this.authService.logout(refreshToken);
      clearAuthCookies(response, this.config);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  me = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = request.auth?.userId;

      if (!userId) {
        throw new UnauthorizedError('Authentication required');
      }

      const user = await this.authService.getCurrentUser(userId);
      response.json({ user });
    } catch (error) {
      next(error);
    }
  };
}
