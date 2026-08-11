import { Route } from '@angular/router';
import { CatalogPage } from './catalog-page';
import { ComponentDetailPage } from './component-detail-page';
import { CreateWorkspacePage } from './create-workspace-page';
import { WorkspaceDetailPage } from './workspace-detail-page';

export const appRoutes: Route[] = [
  { path: 'components', component: CatalogPage },
  { path: 'components/:componentId/workspaces/new', component: CreateWorkspacePage },
  { path: 'components/:componentId', component: ComponentDetailPage },
  { path: 'components/:componentId/workspaces/:workspaceId', component: WorkspaceDetailPage },
  { path: '', pathMatch: 'full', redirectTo: 'components' },
  { path: '**', redirectTo: 'components' },
];
