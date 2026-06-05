import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type { ProjectRepository, WorkspaceProjectsRecord } from './project.repository';
import { ProjectService } from './project.service';

type MockProjectRepository = Pick<
  ProjectRepository,
  'listByUser' | 'findWorkspaceMembership' | 'create'
>;

const createProjectRepository = () =>
  ({
    listByUser: vi.fn(),
    findWorkspaceMembership: vi.fn(),
    create: vi.fn(),
  }) satisfies MockProjectRepository;

const createService = (projectRepository: MockProjectRepository) =>
  new ProjectService(projectRepository as unknown as ProjectRepository);

describe('ProjectService', () => {
  it('lists projects for a user', async () => {
    const workspaceProjects: WorkspaceProjectsRecord[] = [];
    const projectRepository = createProjectRepository();
    projectRepository.listByUser.mockResolvedValue(workspaceProjects);
    const service = createService(projectRepository);

    const result = await service.listProjects('user-1');

    expect(result).toBe(workspaceProjects);
    expect(projectRepository.listByUser).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundError when creating a project outside an accessible workspace', async () => {
    const projectRepository = createProjectRepository();
    projectRepository.findWorkspaceMembership.mockResolvedValue(null);
    const service = createService(projectRepository);

    await expect(
      service.createProject('user-1', 'workspace-1', { name: 'Roadmap' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(projectRepository.findWorkspaceMembership).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
    );
    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it('throws ForbiddenError when the workspace role cannot create projects', async () => {
    const projectRepository = createProjectRepository();
    projectRepository.findWorkspaceMembership.mockResolvedValue({ role: 'viewer' });
    const service = createService(projectRepository);

    await expect(
      service.createProject('user-1', 'workspace-1', { name: 'Roadmap' }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it.each(['owner', 'admin', 'member'] as const)(
    'creates a project for %s workspace role',
    async (role) => {
      const input = { name: 'Roadmap' };
      const createdProject = { id: 'project-1', name: input.name };
      const projectRepository = createProjectRepository();
      projectRepository.findWorkspaceMembership.mockResolvedValue({ role });
      projectRepository.create.mockResolvedValue(createdProject);
      const service = createService(projectRepository);

      const result = await service.createProject('user-1', 'workspace-1', input);

      expect(result).toBe(createdProject);
      expect(projectRepository.findWorkspaceMembership).toHaveBeenCalledWith(
        'workspace-1',
        'user-1',
      );
      expect(projectRepository.create).toHaveBeenCalledWith('workspace-1', input);
    },
  );
});
