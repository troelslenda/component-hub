import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

export type WorkspaceStatus = 'active' | 'review';

export interface ComponentWorkspace {
  id: string;
  componentId: string;
  name: string;
  description: string;
  branch: string;
  status: WorkspaceStatus;
  pullRequestUrl: string;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<ComponentWorkspace[]>([]);
  readonly workspaces = this.state.asReadonly();
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);

  forComponent(componentId: string): ComponentWorkspace[] {
    return this.state().filter((workspace) => workspace.componentId === componentId);
  }

  load(componentId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ workspaces: ComponentWorkspace[] }>(`/api/components/${encodeURIComponent(componentId)}/workspaces`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ workspaces }) => this.state.update((items) => [...items.filter((item) => item.componentId !== componentId), ...workspaces]),
        error: () => this.error.set('Workspaces could not be loaded. Please try again.'),
      });
  }

  getById(id: string | null): ComponentWorkspace | undefined {
    return this.state().find((workspace) => workspace.id === id);
  }

  create(componentId: string, name: string, description: string, onSuccess: (workspace: ComponentWorkspace) => void): void {
    this.creating.set(true);
    this.error.set(null);
    this.http.post<{ workspace: ComponentWorkspace }>(`/api/components/${encodeURIComponent(componentId)}/workspaces`, { name, description })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: ({ workspace }) => {
          this.state.update((items) => [...items.filter((item) => item.id !== workspace.id), workspace]);
          onSuccess(workspace);
        },
        error: (error: HttpErrorResponse) => this.error.set(error.error?.message ?? 'The workspace could not be created. Please try again.'),
      });
  }

  slugify(value: string): string {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
