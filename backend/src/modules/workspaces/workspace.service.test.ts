import { describe, expect, it, vi } from 'vitest';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type {
  WorkspaceMemberRecord,
  WorkspaceRecord,
  WorkspaceRepository,
} from './workspace.repository';
import { WorkspaceService } from './workspace.service';

type MockWorkspaceRepository = Pick<
  WorkspaceRepository,
  | 'listByUser'
  | 'createWithOwner'
  | 'findMembership'
  | 'listMembers'
  | 'findUserByEmail'
  | 'addMember'
>;

const createWorkspaceRepository = () =>
  ({
    listByUser: vi.fn(),
    createWithOwner: vi.fn(),
    findMembership: vi.fn(),
    listMembers: vi.fn(),
    findUserByEmail: vi.fn(),
    addMember: vi.fn(),
  }) satisfies MockWorkspaceRepository;

const createService = (workspaceRepository: MockWorkspaceRepository) =>
  new WorkspaceService(workspaceRepository as unknown as WorkspaceRepository);

const publicUser = {
  id: 'user-2',
  name: 'Taylor',
  email: 'taylor@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const workspaceMember = {
  id: 'membership-2',
  workspaceId: 'workspace-1',
  userId: publicUser.id,
  role: 'member',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  user: publicUser,
} as WorkspaceMemberRecord;

describe('WorkspaceService', () => {
  it('lists workspaces for a user', async () => {
    const workspaces: WorkspaceRecord[] = [];
    const workspaceRepository = createWorkspaceRepository();
    workspaceRepository.listByUser.mockResolvedValue(workspaces);
    const service = createService(workspaceRepository);

    const result = await service.listWorkspaces('user-1');

    expect(result).toBe(workspaces);
    expect(workspaceRepository.listByUser).toHaveBeenCalledWith('user-1');
  });

  it('creates a workspace owned by the user', async () => {
    const input = { name: 'Engineering' };
    const workspace = {
      id: 'workspace-1',
      name: input.name,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'owner',
    } satisfies WorkspaceRecord;
    const workspaceRepository = createWorkspaceRepository();
    workspaceRepository.createWithOwner.mockResolvedValue(workspace);
    const service = createService(workspaceRepository);

    const result = await service.createWorkspace('user-1', input);

    expect(result).toBe(workspace);
    expect(workspaceRepository.createWithOwner).toHaveBeenCalledWith('user-1', input);
  });

  it('throws NotFoundError when listing members outside an accessible workspace', async () => {
    const workspaceRepository = createWorkspaceRepository();
    workspaceRepository.findMembership.mockResolvedValue(null);
    const service = createService(workspaceRepository);

    await expect(service.listMembers('workspace-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(workspaceRepository.listMembers).not.toHaveBeenCalled();
  });

  it.each(['member', 'viewer'] as const)(
    'throws ForbiddenError when a %s tries to add a member',
    async (role) => {
      const workspaceRepository = createWorkspaceRepository();
      workspaceRepository.findMembership.mockResolvedValue({ id: 'membership-1', role });
      const service = createService(workspaceRepository);

      await expect(
        service.addMember('workspace-1', 'user-1', {
          email: 'taylor@example.com',
          role: 'member',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);

      expect(workspaceRepository.findUserByEmail).not.toHaveBeenCalled();
      expect(workspaceRepository.addMember).not.toHaveBeenCalled();
    },
  );

  it('throws NotFoundError when adding an unknown user', async () => {
    const workspaceRepository = createWorkspaceRepository();
    workspaceRepository.findMembership.mockResolvedValue({ id: 'membership-1', role: 'owner' });
    workspaceRepository.findUserByEmail.mockResolvedValue(null);
    const service = createService(workspaceRepository);

    await expect(
      service.addMember('workspace-1', 'user-1', {
        email: 'missing@example.com',
        role: 'member',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(workspaceRepository.addMember).not.toHaveBeenCalled();
  });

  it('throws ConflictError when the user is already a member', async () => {
    const workspaceRepository = createWorkspaceRepository();
    workspaceRepository.findMembership
      .mockResolvedValueOnce({ id: 'membership-1', role: 'owner' })
      .mockResolvedValueOnce({ id: 'membership-2', role: 'member' });
    workspaceRepository.findUserByEmail.mockResolvedValue(publicUser);
    const service = createService(workspaceRepository);

    await expect(
      service.addMember('workspace-1', 'user-1', {
        email: publicUser.email,
        role: 'member',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(workspaceRepository.addMember).not.toHaveBeenCalled();
  });

  it.each(['owner', 'admin'] as const)(
    'adds a workspace member when the actor is %s',
    async (role) => {
      const workspaceRepository = createWorkspaceRepository();
      workspaceRepository.findMembership
        .mockResolvedValueOnce({ id: 'membership-1', role })
        .mockResolvedValueOnce(null);
      workspaceRepository.findUserByEmail.mockResolvedValue(publicUser);
      workspaceRepository.addMember.mockResolvedValue(workspaceMember);
      const service = createService(workspaceRepository);

      const result = await service.addMember('workspace-1', 'user-1', {
        email: publicUser.email,
        role: 'member',
      });

      expect(result).toBe(workspaceMember);
      expect(workspaceRepository.addMember).toHaveBeenCalledWith(
        'workspace-1',
        publicUser.id,
        'member',
      );
    },
  );
});
