import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { storybookEmbedUrl, storybookUrl } from './catalog-data';
import { CatalogService } from './catalog.service';
import { WorkspaceService } from './workspace.service';

@Component({
  imports: [RouterLink],
  templateUrl: './component-detail-page.html',
})
export class ComponentDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly workspaces = inject(WorkspaceService);
  protected readonly catalog = inject(CatalogService);
  private readonly componentId =
    this.route.snapshot.paramMap.get('componentId')!;
  protected readonly component = computed(() =>
    this.catalog.getById(this.componentId),
  );
  protected readonly componentWorkspaces = computed(() =>
    this.workspaces.forComponent(this.componentId),
  );
  protected readonly storybookUrl = storybookUrl;
  protected readonly embedUrl = computed(() => {
    const component = this.component();
    return component
      ? this.sanitizer.bypassSecurityTrustResourceUrl(
          storybookEmbedUrl(component),
        )
      : null;
  });

  constructor() {
    this.catalog.loadById(this.componentId);
    this.workspaces.load(this.componentId);
  }
}
