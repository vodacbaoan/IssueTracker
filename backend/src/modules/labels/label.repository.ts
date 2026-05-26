import type { Label, PrismaClient } from '@prisma/client';

export class LabelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(): Promise<Label[]> {
    return this.prisma.label.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
