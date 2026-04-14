import type { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export const authUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
