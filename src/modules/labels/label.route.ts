import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { LabelController } from './label.controller';
import { LabelRepository } from './label.repository';
import { LabelService } from './label.service';

export function createLabelRouter(prisma: PrismaClient): Router {
  const router = Router();
  const labelRepository = new LabelRepository(prisma);
  const labelService = new LabelService(labelRepository);
  const labelController = new LabelController(labelService);

  router.get('/', labelController.list);

  return router;
}
