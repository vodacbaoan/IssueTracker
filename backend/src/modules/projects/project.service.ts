import type { Project } from '@prisma/client';
import type { ProjectRepository } from './project.repository';
import type { CreateProjectBody } from './project.schema';

export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async listProjects(): Promise<Project[]> {
    return this.projectRepository.list();
  }

  async createProject(input: CreateProjectBody): Promise<Project> {
    return this.projectRepository.create(input);
  }
}
