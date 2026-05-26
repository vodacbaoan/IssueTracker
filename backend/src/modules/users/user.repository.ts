import type { PrismaClient } from '@prisma/client';
import { publicUserSelect, type PublicUser } from './user.types';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { name: 'asc' },
    });
  }
}
