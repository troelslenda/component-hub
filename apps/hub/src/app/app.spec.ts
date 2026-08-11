import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import { WorkspaceService } from './workspace.service';
import { CatalogComponent } from './catalog-data';

describe('Component Hub services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the component catalog from the API', () => {
    const catalog = TestBed.inject(CatalogService);
    const component = {
      id: 'date-range-picker',
      name: 'Date Range Picker',
      packageName: '@organization/date-range-picker',
    } as CatalogComponent;

    catalog.load();
    http.expectOne('/api/components').flush({ components: [component] });

    expect(catalog.getById('date-range-picker')?.name).toBe('Date Range Picker');
    expect(catalog.loading()).toBe(false);
  });

  it('loads and creates workspaces through the component API', () => {
    const workspaces = TestBed.inject(WorkspaceService);
    const workspace = {
      id: 'accessible-alerts',
      componentId: 'notification-banner',
      name: 'Accessible alerts',
      description: 'Explore screen reader behavior.',
      branch: 'workspace/accessible-alerts',
      status: 'active' as const,
      pullRequestUrl: '',
    };

    workspaces.load('notification-banner');
    http.expectOne('/api/components/notification-banner/workspaces').flush({ workspaces: [] });

    let createdId = '';
    workspaces.create('notification-banner', workspace.name, workspace.description, (created) => createdId = created.id);
    const request = http.expectOne('/api/components/notification-banner/workspaces');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: workspace.name, description: workspace.description });
    request.flush({ workspace });

    expect(createdId).toBe('accessible-alerts');
    expect(workspaces.getById('accessible-alerts')).toEqual(workspace);
  });
});
