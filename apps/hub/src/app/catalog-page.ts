import { RouterLink } from '@angular/router';
import { Component, computed, inject, signal } from '@angular/core';
import { ComponentStatus, storybookUrl } from './catalog-data';
import { CatalogService } from './catalog.service';

@Component({
  imports: [RouterLink],
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  protected readonly catalogService = inject(CatalogService);
  protected readonly components = this.catalogService.components;
  protected readonly query = signal('');
  protected readonly status = signal<ComponentStatus | 'all'>('all');
  protected readonly statuses: Array<ComponentStatus | 'all'> = ['all', 'poc', 'experimental', 'beta', 'production'];
  protected readonly storybookUrl = storybookUrl;
  protected readonly filteredComponents = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.components().filter((component) =>
      (this.status() === 'all' || component.status === this.status()) &&
      (!query || [component.name, component.description, component.packageName, ...component.owners]
        .some((value) => value.toLowerCase().includes(query))),
    );
  });

  constructor() { this.catalogService.load(); }

  protected updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
