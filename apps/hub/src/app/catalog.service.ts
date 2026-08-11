import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CatalogComponent } from './catalog-data';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  readonly components = signal<CatalogComponent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    if (this.loading() || this.components().length) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ components: CatalogComponent[] }>('/api/components')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ components }) => this.components.set(components),
        error: () => this.error.set('The component catalog could not be loaded. Please try again.'),
      });
  }

  loadById(id: string): void {
    if (this.loading() || this.getById(id)) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ component: CatalogComponent }>(`/api/components/${encodeURIComponent(id)}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ component }) => this.components.update((items) => [...items.filter((item) => item.id !== component.id), component]),
        error: () => this.error.set('The component could not be loaded.'),
      });
  }

  getById(id: string | null): CatalogComponent | undefined {
    return this.components().find((component) => component.id === id);
  }
}
