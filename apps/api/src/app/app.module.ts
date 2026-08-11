import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubWorkspaceRepository } from './github-workspace.repository';
import { WorkspacesController } from './workspaces.controller';
import { WORKSPACE_REPOSITORY, WorkspacesService } from './workspaces.service';

@Module({
  imports: [],
  controllers: [AppController, WorkspacesController],
  providers: [
    AppService,
    WorkspacesService,
    GithubWorkspaceRepository,
    { provide: WORKSPACE_REPOSITORY, useExisting: GithubWorkspaceRepository },
  ],
})
export class AppModule {}
