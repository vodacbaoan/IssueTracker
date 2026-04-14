import type { PrismaClient } from '@prisma/client';
import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AppConfig } from '../../config/env';
import { BadRequestError } from '../../lib/errors';
import { AuthController } from './auth.controller';
import { requireAuth } from './auth.middleware';
import { AuthRepository } from './auth.repository';
import { loginBodySchema, signupBodySchema } from './auth.schema';
import { AuthService } from './auth.service';

export function createAuthRouter(prisma: PrismaClient, config: AppConfig): Router {
  const router = Router();
  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(authRepository, config);
  const authController = new AuthController(authService, config);

  const validateSignup = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = signupBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(new BadRequestError('Request validation failed', validationResult.error.flatten()));
      return;
    }

    request.body = validationResult.data;
    next();
  };

  const validateLogin = (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void => {
    const validationResult = loginBodySchema.safeParse(request.body);

    if (!validationResult.success) {
      next(new BadRequestError('Request validation failed', validationResult.error.flatten()));
      return;
    }

    request.body = validationResult.data;
    next();
  };

  router.post('/signup', validateSignup, authController.signup);
  router.post('/login', validateLogin, authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/logout', authController.logout);
  router.get('/me', requireAuth, authController.me);

  return router;
}
