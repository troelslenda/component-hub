import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { WorkspacesService } from './workspaces.service';

interface CreateWorkspaceBody { name?: string; description?: string }

@Controller()
export class WorkspacesController {
  constructor(private readonly components: AppService, private readonly workspaces: WorkspacesService) {}

  @Get('components/:componentId/workspaces')
  async list(@Param('componentId') componentId: string) {
    this.components.getComponent(componentId);
    return { workspaces: await this.workspaces.list(componentId) };
  }

  @Post('components/:componentId/workspaces')
  async create(@Param('componentId') componentId: string, @Body() body: CreateWorkspaceBody) {
    this.components.getComponent(componentId);
    const name = body.name?.trim();
    if (!name || name.length < 3) throw new BadRequestException('Workspace name must contain at least three characters.');
    return { workspace: await this.workspaces.create({ componentId, name, description: body.description?.trim() }) };
  }
}
