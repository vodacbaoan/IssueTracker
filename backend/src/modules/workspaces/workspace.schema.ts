import { z } from 'zod';

export const createWorkspaceBodySchema = z.object({
  name: z.string().min(2).max(120),
});

export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;
