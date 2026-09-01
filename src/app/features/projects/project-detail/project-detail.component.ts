import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { MaterialCatalogService } from '../../../core/services/material-catalog.service';
import { MaterialBudgetService } from '../../../core/services/material-budget.service';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../core/services/purchase-unit.service';
import { Category } from '../../../core/models/category.model';
import { MaterialBudgetItem } from '../../../core/models/material-budget.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyClpPipe } from '../../../shared/pipes/currency-clp.pipe';
import { WeightKgPipe } from '../../../shared/pipes/weight-kg.pipe';

// Child Components
import { AddFromCatalogModalComponent } from './components/add-from-catalog-modal/add-from-catalog-modal.component';
import { AddGlobalItemModalComponent } from './components/add-global-item-modal/add-global-item-modal.component';
import { AddCustomItemModalComponent } from './components/add-custom-item-modal/add-custom-item-modal.component';
import { EditBudgetItemModalComponent } from './components/edit-budget-item-modal/edit-budget-item-modal.component';
import { BudgetItemsTableComponent } from './components/budget-items-table/budget-items-table.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    CurrencyClpPipe,
    WeightKgPipe,
    AddFromCatalogModalComponent,
    AddGlobalItemModalComponent,
    AddCustomItemModalComponent,
    EditBudgetItemModalComponent,
    BudgetItemsTableComponent,
  ],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  readonly id = input.required<string>();

  protected readonly projectService = inject(ProjectService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly budgetService = inject(MaterialBudgetService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);

  // Selected Category in the internal menu
  readonly selectedCategory = signal<Category | null>(null);

  // Budget view mode: 'grouped' (by subcategories) | 'flat' (all items table)
  readonly budgetViewMode = signal<'grouped' | 'flat'>('grouped');
  readonly budgetSearchTerm = signal<string>('');

  // Modals state & presets
  readonly isFromCatalogModalOpen = signal(false);
  readonly isFromCatalogGlobalModalOpen = signal(false);
  readonly isCustomItemModalOpen = signal(false);
  readonly isEditItemModalOpen = signal(false);
  readonly isDeleteItemModalOpen = signal(false);
  readonly modalPresetSubcategoryId = signal<number | null>(null);
  readonly itemToEdit = signal<MaterialBudgetItem | null>(null);
  readonly itemToDelete = signal<MaterialBudgetItem | null>(null);
  readonly isProcessing = signal(false);

  readonly projectIdNumber = computed(() => Number(this.id()) || 0);

  // Filtered flat budget items
  readonly filteredBudgetItems = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const list = this.budgetService.items();
    if (!term) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.detail && item.detail.toLowerCase().includes(term)) ||
        (item.subcategory_detail && item.subcategory_detail.name.toLowerCase().includes(term))
    );
  });

  // Filtered grouped budget
  readonly filteredGroupedBudget = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const grouped = this.budgetService.groupedBudget();
    if (!grouped) return [];

    return grouped.groups
      .map((g) => {
        const filteredItems = !term
          ? g.items
          : g.items.filter(
              (item) =>
                item.name.toLowerCase().includes(term) ||
                (item.detail && item.detail.toLowerCase().includes(term))
            );

        const subtotalCost = filteredItems.reduce(
          (acc, item) => acc + (Number(item.estimated_cost) || 0),
          0
        );

        const subtotalWeight = filteredItems.reduce(
          (acc, item) => acc + (Number(item.weight_total) || 0),
          0
        );

        return {
          ...g,
          items: filteredItems,
          items_count: filteredItems.length,
          subtotal_cost: subtotalCost,
          subtotal_weight: subtotalWeight,
        };
      })
      .filter((g) => g.items.length > 0 || g.subcategory_name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    const projectId = this.projectIdNumber();
    if (projectId) {
      this.projectService.getProjectById(projectId).subscribe();
      this.refreshBudget();
    }
    this.categoryService.loadCategories().subscribe({
      next: (cats) => {
        if (cats.length > 0 && !this.selectedCategory()) {
          const materialsCat = cats.find((c) =>
            c.name.toLowerCase().includes('material')
          );
          this.selectedCategory.set(materialsCat || cats[0]);
        }
      },
    });
    this.subcategoryService.loadSubcategories().subscribe();
    this.catalogService.loadCatalog().subscribe();
    this.uomService.loadUnits().subscribe();
    this.puService.loadUnits().subscribe();
  }

  refreshBudget(): void {
    const projectId = this.projectIdNumber();
    if (!projectId) return;
    this.budgetService.loadBudgetByProject(projectId).subscribe();
    this.budgetService.loadBudgetSummary(projectId).subscribe();
  }

  selectCategory(cat: Category): void {
    this.selectedCategory.set(cat);
  }

  isMaterialsCategorySelected(): boolean {
    const cat = this.selectedCategory();
    if (!cat) return false;
    return cat.name.toLowerCase().includes('material');
  }

  // --- Modal Open Helpers ---
  openFromCatalogModal(presetSubcatId?: number): void {
    this.modalPresetSubcategoryId.set(presetSubcatId || null);
    this.isFromCatalogModalOpen.set(true);
  }

  openFromCatalogGlobalModal(): void {
    this.isFromCatalogGlobalModalOpen.set(true);
  }

  openCustomItemModal(presetSubcatId?: number): void {
    this.modalPresetSubcategoryId.set(presetSubcatId || null);
    this.isCustomItemModalOpen.set(true);
  }

  openEditItemModal(item: MaterialBudgetItem): void {
    this.itemToEdit.set(item);
    this.isEditItemModalOpen.set(true);
  }

  openDeleteItemModal(item: MaterialBudgetItem): void {
    this.itemToDelete.set(item);
    this.isDeleteItemModalOpen.set(true);
  }

  closeDeleteItemModal(): void {
    this.isDeleteItemModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  submitDeleteItem(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.isProcessing.set(true);
    this.budgetService.deleteBudgetItem(item.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteItemModal();
        this.refreshBudget();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }
}
