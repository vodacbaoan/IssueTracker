import { z } from 'zod';

export const issueStatusValues = ['todo', 'in_progress', 'done'] as const;
export const issuePriorityValues = ['low', 'medium', 'high'] as const;

export const createIssueBodySchema = z.object({
  title: z.string().min(2).max(160),
  priority: z.enum(issuePriorityValues).optional().default('medium'),
  assigneeId: z.string().uuid().nullable().optional().default(null),
});

export const updateIssueStatusBodySchema = z.object({
  status: z.enum(issueStatusValues),
});

export const updateIssueAssigneeBodySchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export type CreateIssueBody = z.infer<typeof createIssueBodySchema>;
export type UpdateIssueStatusBody = z.infer<typeof updateIssueStatusBodySchema>;
export type UpdateIssueAssigneeBody = z.infer<typeof updateIssueAssigneeBodySchema>;
