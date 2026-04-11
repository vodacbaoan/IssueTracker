import { z } from 'zod';

export const issueStatusValues = ['todo', 'in_progress', 'done'] as const;

export const createIssueBodySchema = z.object({
  title: z.string().min(2).max(160),
});

export const updateIssueStatusBodySchema = z.object({
  status: z.enum(issueStatusValues),
});

export type CreateIssueBody = z.infer<typeof createIssueBodySchema>;
export type UpdateIssueStatusBody = z.infer<typeof updateIssueStatusBodySchema>;
