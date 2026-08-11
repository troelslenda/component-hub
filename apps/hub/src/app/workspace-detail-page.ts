import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { WorkspaceService } from './workspace.service';

@Component({ imports: [RouterLink], templateUrl: './workspace-detail-page.html' })
export class WorkspaceDetailPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly workspaces = inject(WorkspaceService);
  protected readonly catalog = inject(CatalogService);
  private readonly componentId = this.route.snapshot.paramMap.get('componentId')!;
  private readonly workspaceId = this.route.snapshot.paramMap.get('workspaceId');
  protected readonly workspace = computed(() => this.workspaces.getById(this.workspaceId));
  protected readonly component = computed(() => this.catalog.getById(this.componentId));

  constructor() {
    this.catalog.loadById(this.componentId);
    this.workspaces.load(this.componentId);
  }
}
