import type { PrismaClient, Project } from '@prisma/client';
import type { CreateProjectBody } from './project.schema';

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(): Promise<Project[]> {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateProjectBody): Promise<Project> {
    return this.prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }
}
