import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { WorkspaceRecord, WorkspaceRepository } from './workspaces.service';

@Injectable()
export class GithubWorkspaceRepository implements WorkspaceRepository {
  async list(): Promise<WorkspaceRecord[]> {
    return [];
  }

  async create(): Promise<WorkspaceRecord> {
    throw new ServiceUnavailableException({ code: 'GITHUB_NOT_CONFIGURED', message: 'GitHub App workspace creation is not configured yet.' });
  }
}
