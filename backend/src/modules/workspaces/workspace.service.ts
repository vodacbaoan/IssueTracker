import type { WorkspaceRole } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type { AddWorkspaceMemberBody, CreateWorkspaceBody } from './workspace.schema';
import type {
  WorkspaceMemberRecord,
  WorkspaceRecord,
  WorkspaceRepository,
} from './workspace.repository';

export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  private static canManageMembers(role: WorkspaceRole): boolean {
    return role === 'owner' || role === 'admin';
  }

  private async getMembership(
    workspaceId: string,
    userId: string,
  ): Promise<{ id: string; role: WorkspaceRole }> {
    const membership = await this.workspaceRepository.findMembership(workspaceId, userId);

    if (!membership) {
      throw new NotFoundError('Workspace not found');
    }

    return membership;
  }

  listWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
    return this.workspaceRepository.listByUser(userId);
  }

  createWorkspace(userId: string, input: CreateWorkspaceBody): Promise<WorkspaceRecord> {
    return this.workspaceRepository.createWithOwner(userId, input);
  }

  async listMembers(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord[]> {
    await this.getMembership(workspaceId, userId);
    return this.workspaceRepository.listMembers(workspaceId);
  }

  async addMember(
    workspaceId: string,
    actorUserId: string,
    input: AddWorkspaceMemberBody,
  ): Promise<WorkspaceMemberRecord> {
    const actorMembership = await this.getMembership(workspaceId, actorUserId);

    if (!WorkspaceService.canManageMembers(actorMembership.role)) {
      throw new ForbiddenError('Only workspace owners and admins can add members');
    }

    const user = await this.workspaceRepository.findUserByEmail(input.email);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existingMembership = await this.workspaceRepository.findMembership(workspaceId, user.id);

    if (existingMembership) {
      throw new ConflictError('User is already a workspace member');
    }

    return this.workspaceRepository.addMember(workspaceId, user.id, input.role);
  }
}
