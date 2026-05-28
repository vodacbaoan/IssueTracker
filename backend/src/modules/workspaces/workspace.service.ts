import type { CreateWorkspaceBody } from './workspace.schema';
import type { WorkspaceRecord, WorkspaceRepository } from './workspace.repository';

export class WorkspaceService {
  constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  listWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
    return this.workspaceRepository.listByUser(userId);
  }

  createWorkspace(userId: string, input: CreateWorkspaceBody): Promise<WorkspaceRecord> {
    return this.workspaceRepository.createWithOwner(userId, input);
  }
}
