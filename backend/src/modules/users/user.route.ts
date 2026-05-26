import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

export function createUserRouter(prisma: PrismaClient): Router {
  const router = Router();
  const userRepository = new UserRepository(prisma);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  router.get('/', userController.list);

  return router;
}
