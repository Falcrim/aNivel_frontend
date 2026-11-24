import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { CategoryService } from '../../core/services/category.service';
import { SubcategoryService } from '../../core/services/subcategory.service';
import { MaterialCatalogService } from '../../core/services/material-catalog.service';
import { SupplierService } from '../../core/services/supplier.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InfoTooltipComponent } from '../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent, InfoTooltipComponent],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly projectService = inject(ProjectService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly supplierService = inject(SupplierService);

  // Quick create modals
  isCreateProjectOpen = signal(false);
  newProjectName = signal('');
  isCreatingProject = signal(false);

  // Computed metrics
  totalProjects = computed(() => this.projectService.projects().length);
  totalCategories = computed(() => this.categoryService.categories().length);
  totalSubcategories = computed(() => this.subcategoryService.subcategories().length);
  totalCatalogItems = computed(() => this.catalogService.items().length);
  totalSuppliers = computed(() => this.supplierService.suppliers().length);

  recentProjects = computed(() => {
    return [...this.projectService.projects()].reverse().slice(0, 4);
  });

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'budget':
        return 'En Presupuesto';
      case 'paused':
        return 'Pausada';
      case 'completed':
        return 'Finalizada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status || 'Activa';
    }
  }

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe();
    this.categoryService.loadCategories().subscribe();
    this.subcategoryService.loadSubcategories().subscribe();
    this.catalogService.loadCatalog().subscribe();
    this.supplierService.loadSuppliers().subscribe();
  }

  openCreateProjectModal(): void {
    this.newProjectName.set('');
    this.isCreateProjectOpen.set(true);
  }

  closeCreateProjectModal(): void {
    this.isCreateProjectOpen.set(false);
  }

  submitCreateProject(): void {
    const name = this.newProjectName().trim();
    if (!name) return;

    this.isCreatingProject.set(true);
    this.projectService.createProject({ name }).subscribe({
      next: () => {
        this.isCreatingProject.set(false);
        this.closeCreateProjectModal();
      },
      error: () => {
        this.isCreatingProject.set(false);
      },
    });
  }
}
