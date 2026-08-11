import { Inject, Injectable } from '@nestjs/common';

export interface WorkspaceRecord {
  id: string;
  componentId: string;
  name: string;
  description: string;
  branch: string;
  pullRequestUrl: string;
  status: 'active' | 'review';
}

export interface CreateWorkspaceCommand {
  componentId: string;
  name: string;
  description?: string;
}

export interface WorkspaceRepository {
  list(componentId: string): Promise<WorkspaceRecord[]>;
  create(command: CreateWorkspaceCommand): Promise<WorkspaceRecord>;
}

export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');

@Injectable()
export class WorkspacesService {
  constructor(@Inject(WORKSPACE_REPOSITORY) private readonly repository: WorkspaceRepository) {}
  list(componentId: string) { return this.repository.list(componentId); }
  create(command: CreateWorkspaceCommand) { return this.repository.create(command); }
}
