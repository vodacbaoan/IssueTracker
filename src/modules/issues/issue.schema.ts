import { z } from 'zod';

export const issueStatusValues = ['todo', 'in_progress', 'done'] as const;
export const issuePriorityValues = ['low', 'medium', 'high'] as const;
const issueLabelIdsSchema = z
  .array(z.string().uuid())
  .max(12)
  .transform((labelIds) => [...new Set(labelIds)]);

export const createIssueBodySchema = z.object({
  title: z.string().min(2).max(160),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((description) => (description && description.length > 0 ? description : undefined)),
  priority: z.enum(issuePriorityValues).optional().default('medium'),
  assigneeId: z.string().uuid().nullable().optional().default(null),
  labelIds: issueLabelIdsSchema.optional().default([]),
});

export const updateIssueStatusBodySchema = z.object({
  status: z.enum(issueStatusValues),
});

export const updateIssueAssigneeBodySchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export const updateIssueLabelsBodySchema = z.object({
  labelIds: issueLabelIdsSchema,
});

export type CreateIssueBody = z.infer<typeof createIssueBodySchema>;
export type UpdateIssueStatusBody = z.infer<typeof updateIssueStatusBodySchema>;
export type UpdateIssueAssigneeBody = z.infer<typeof updateIssueAssigneeBodySchema>;
export type UpdateIssueLabelsBody = z.infer<typeof updateIssueLabelsBodySchema>;
