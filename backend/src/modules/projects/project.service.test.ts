import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../lib/errors';
import type { ProjectRepository } from './project.repository';
import { ProjectService } from './project.service';

type MockProjectRepository = Pick<
  ProjectRepository,
  'listByUser' | 'findWorkspaceMembership' | 'create'
>;

describe('ProjectService', () => {
  it('throws NotFoundError when creating a project outside an accessible workspace', async () => {
    const projectRepository = {
      listByUser: vi.fn(),
      findWorkspaceMembership: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    } satisfies MockProjectRepository;
    const service = new ProjectService(projectRepository as unknown as ProjectRepository);

    await expect(
      service.createProject('user-1', 'workspace-1', { name: 'Roadmap' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(projectRepository.findWorkspaceMembership).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
    );
    expect(projectRepository.create).not.toHaveBeenCalled();
  });
});
