import { z } from 'zod';

export const createWorkspaceBodySchema = z.object({
  name: z.string().min(2).max(120),
});

export const addWorkspaceMemberBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

export type AddWorkspaceMemberBody = z.infer<typeof addWorkspaceMemberBodySchema>;
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;
