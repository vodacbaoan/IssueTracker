import { Router } from 'express';
import type { AppConfig } from '../../config/env';

export function createHealthRouter(config: AppConfig): Router {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({
      status: 'ok',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
