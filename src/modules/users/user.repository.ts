import type { PrismaClient, User } from '@prisma/client';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
