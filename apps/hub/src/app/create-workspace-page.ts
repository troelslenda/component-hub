import { Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { WorkspaceService } from './workspace.service';

@Component({ imports: [ReactiveFormsModule, RouterLink], templateUrl: './create-workspace-page.html' })
export class CreateWorkspacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly workspaceService = inject(WorkspaceService);
  protected readonly catalog = inject(CatalogService);
  private readonly componentId = this.route.snapshot.paramMap.get('componentId')!;
  protected readonly component = computed(() => this.catalog.getById(this.componentId));
  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected create(): void {
    if (!this.component() || this.form.invalid) return;
    this.workspaceService.create(this.componentId, this.form.controls.name.value, this.form.controls.description.value, (workspace) => {
      void this.router.navigate(['/components', this.componentId, 'workspaces', workspace.id]);
    });
  }

  constructor() { this.catalog.loadById(this.componentId); }
}
