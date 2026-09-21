import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { MaterialCatalogService } from '../../../core/services/material-catalog.service';
import { MaterialBudgetService } from '../../../core/services/material-budget.service';
import { LaborCatalogService } from '../../../core/services/labor-catalog.service';
import { LaborBudgetService } from '../../../core/services/labor-budget.service';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../core/services/purchase-unit.service';
import { Category } from '../../../core/models/category.model';
import { MaterialBudgetItem } from '../../../core/models/material-budget.model';
import { LaborBudgetItem } from '../../../core/models/labor-budget.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyClpPipe, UsdPipe } from '../../../shared/pipes/currency-clp.pipe';
import { WeightKgPipe } from '../../../shared/pipes/weight-kg.pipe';

// Child Components - Materiales
import { AddFromCatalogModalComponent } from './components/add-from-catalog-modal/add-from-catalog-modal.component';
import { AddGlobalItemModalComponent } from './components/add-global-item-modal/add-global-item-modal.component';
import { AddCustomItemModalComponent } from './components/add-custom-item-modal/add-custom-item-modal.component';
import { EditBudgetItemModalComponent } from './components/edit-budget-item-modal/edit-budget-item-modal.component';
import { BudgetItemsTableComponent } from './components/budget-items-table/budget-items-table.component';

// Child Components - Proyecto & Mano de Obra
import { EditProjectModalComponent } from './components/edit-project-modal/edit-project-modal.component';
import { LaborItemsTableComponent } from './components/labor-items-table/labor-items-table.component';
import { AddLaborFromCatalogModalComponent } from './components/add-labor-from-catalog-modal/add-labor-from-catalog-modal.component';
import { AddLaborCustomItemModalComponent } from './components/add-labor-custom-item-modal/add-labor-custom-item-modal.component';
import { EditLaborItemModalComponent } from './components/edit-labor-item-modal/edit-labor-item-modal.component';
import { ProjectDocumentsComponent } from './components/project-documents/project-documents.component';
import { ProjectExpensesComponent } from './components/project-expenses/project-expenses.component';
import { ProjectDocumentService } from '../../../core/services/project-document.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogComponent,
    CurrencyClpPipe,
    UsdPipe,
    WeightKgPipe,
    AddFromCatalogModalComponent,
    AddGlobalItemModalComponent,
    AddCustomItemModalComponent,
    EditBudgetItemModalComponent,
    BudgetItemsTableComponent,
    EditProjectModalComponent,
    LaborItemsTableComponent,
    AddLaborFromCatalogModalComponent,
    AddLaborCustomItemModalComponent,
    EditLaborItemModalComponent,
    ProjectDocumentsComponent,
    ProjectExpensesComponent,
  ],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  readonly id = input.required<string>();

  // Main Mode: 'budget' (Presupuesto & Cotizaciones) | 'expenses' (Gastos Reales & Comprobantes)
  readonly activeMode = signal<'budget' | 'expenses'>('budget');

  protected readonly projectService = inject(ProjectService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly budgetService = inject(MaterialBudgetService);
  protected readonly laborCatalogService = inject(LaborCatalogService);
  protected readonly laborBudgetService = inject(LaborBudgetService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);
  protected readonly documentService = inject(ProjectDocumentService);

  // Selected Category in the internal menu
  readonly selectedCategory = signal<Category | null>(null);
  readonly isDocumentsViewSelected = signal<boolean>(false);

  // Budget view mode: 'grouped' (by subcategories) | 'flat' (all items table)
  readonly budgetViewMode = signal<'grouped' | 'flat'>('grouped');
  readonly budgetSearchTerm = signal<string>('');

  // Modals state & presets - Materiales
  readonly isFromCatalogModalOpen = signal(false);
  readonly isFromCatalogGlobalModalOpen = signal(false);
  readonly isCustomItemModalOpen = signal(false);
  readonly isEditItemModalOpen = signal(false);
  readonly isDeleteItemModalOpen = signal(false);
  readonly modalPresetSubcategoryId = signal<number | null>(null);
  readonly itemToEdit = signal<MaterialBudgetItem | null>(null);
  readonly itemToDelete = signal<MaterialBudgetItem | null>(null);

  // Modals state & presets - Mano de Obra
  readonly isAddLaborFromCatalogOpen = signal(false);
  readonly isAddLaborCustomOpen = signal(false);
  readonly isEditLaborItemOpen = signal(false);
  readonly isDeleteLaborItemOpen = signal(false);
  readonly presetLaborSubcategoryId = signal<number | null>(null);
  readonly laborItemToEdit = signal<LaborBudgetItem | null>(null);
  readonly laborItemToDelete = signal<LaborBudgetItem | null>(null);

  // Modal state - Edición del Proyecto
  readonly isEditProjectModalOpen = signal(false);
  readonly isProcessing = signal(false);

  readonly projectIdNumber = computed(() => Number(this.id()) || 0);

  // Consolidated Obra Totals (Materiales + Mano de Obra)
  readonly projectTotalCostBs = computed<number>(() => {
    const matCost = Number(this.budgetService.summary()?.total_materials_cost) || 0;
    const laborCost = Number(this.laborBudgetService.summary()?.total_labor_cost_bs) || 0;
    return matCost + laborCost;
  });

  readonly projectTotalCostUsd = computed<number>(() => {
    const totalBs = this.projectTotalCostBs();
    const rate = Number(this.projectService.selectedProject()?.exchange_rate) || 6.97;
    return rate > 0 ? Number((totalBs / rate).toFixed(2)) : 0;
  });

  readonly materialTotalCostUsd = computed<number>(() => {
    const costBs = Number(this.budgetService.summary()?.total_materials_cost) || 0;
    const rate = Number(this.projectService.selectedProject()?.exchange_rate) || 6.97;
    return rate > 0 ? Number((costBs / rate).toFixed(2)) : 0;
  });


  // Filtered flat budget items - Materiales
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

  // Filtered grouped budget - Materiales
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

  // Filtered flat items - Mano de Obra
  readonly filteredLaborItems = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const list = this.laborBudgetService.items();
    if (!term) return list;
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.detail && item.detail.toLowerCase().includes(term)) ||
        (item.contractor_name && item.contractor_name.toLowerCase().includes(term)) ||
        (item.subcategory_detail && item.subcategory_detail.name.toLowerCase().includes(term))
    );
  });

  // Filtered grouped budget - Mano de Obra
  readonly filteredGroupedLabor = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const grouped = this.laborBudgetService.groupedBudget();
    if (!grouped) return [];

    return grouped.groups
      .map((g) => {
        const filteredItems = !term
          ? g.items
          : g.items.filter(
              (item) =>
                item.name.toLowerCase().includes(term) ||
                (item.detail && item.detail.toLowerCase().includes(term)) ||
                (item.contractor_name && item.contractor_name.toLowerCase().includes(term))
            );

        const subtotalCostBs = filteredItems.reduce(
          (acc, item) => acc + (Number(item.estimated_cost) || 0),
          0
        );

        const exchangeRate = Number(grouped.exchange_rate) || 6.97;
        const builtArea = Number(grouped.built_area) || 0;
        const subtotalCostUsd = exchangeRate > 0 ? Number((subtotalCostBs / exchangeRate).toFixed(2)) : 0;
        const costPerM2Usd = builtArea > 0 ? Number((subtotalCostUsd / builtArea).toFixed(2)) : 0;

        return {
          ...g,
          items: filteredItems,
          items_count: filteredItems.length,
          subtotal_cost_bs: subtotalCostBs,
          subtotal_cost_usd: subtotalCostUsd,
          cost_per_m2_usd: costPerM2Usd,
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
    this.laborCatalogService.loadCatalog().subscribe();
    this.uomService.loadUnits().subscribe();
    this.puService.loadUnits().subscribe();
  }

  refreshBudget(): void {
    const projectId = this.projectIdNumber();
    if (!projectId) return;

    this.projectService.getProjectById(projectId).subscribe();
    this.budgetService.loadBudgetSummary(projectId).subscribe();
    this.laborBudgetService.loadBudgetSummary(projectId).subscribe();
    this.documentService.loadSummary(projectId).subscribe();
    this.documentService.loadDocuments(projectId).subscribe();

    if (this.isMaterialsCategorySelected()) {
      this.budgetService.loadBudgetByProject(projectId).subscribe();
    } else if (this.isLaborCategorySelected()) {
      this.laborBudgetService.loadBudgetByProject(projectId).subscribe();
    }
  }

  selectCategory(cat: Category): void {
    this.isDocumentsViewSelected.set(false);
    this.selectedCategory.set(cat);
    const projectId = this.projectIdNumber();
    if (!projectId) return;

    if (cat.name.toLowerCase().includes('material')) {
      this.budgetService.loadBudgetByProject(projectId).subscribe();
    } else if (cat.name.toLowerCase().includes('mano')) {
      this.laborBudgetService.loadBudgetByProject(projectId).subscribe();
    }
  }

  selectDocumentsView(): void {
    this.isDocumentsViewSelected.set(true);
    const projectId = this.projectIdNumber();
    if (projectId) {
      this.documentService.loadDocuments(projectId).subscribe();
      this.documentService.loadSummary(projectId).subscribe();
    }
  }

  isMaterialsCategorySelected(): boolean {
    const cat = this.selectedCategory();
    if (!cat) return false;
    return cat.name.toLowerCase().includes('material');
  }

  isLaborCategorySelected(): boolean {
    const cat = this.selectedCategory();
    if (!cat) return false;
    return cat.name.toLowerCase().includes('mano');
  }

  // --- Modal Helpers - Materiales ---
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

  // --- Modal Helpers - Mano de Obra ---
  openAddLaborFromCatalogModal(presetSubcatId?: number): void {
    this.presetLaborSubcategoryId.set(presetSubcatId || null);
    this.isAddLaborFromCatalogOpen.set(true);
  }

  openAddLaborCustomModal(presetSubcatId?: number): void {
    this.presetLaborSubcategoryId.set(presetSubcatId || null);
    this.isAddLaborCustomOpen.set(true);
  }

  openEditLaborItemModal(item: LaborBudgetItem): void {
    this.laborItemToEdit.set(item);
    this.isEditLaborItemOpen.set(true);
  }

  openDeleteLaborItemModal(item: LaborBudgetItem): void {
    this.laborItemToDelete.set(item);
    this.isDeleteLaborItemOpen.set(true);
  }

  closeDeleteLaborItemModal(): void {
    this.isDeleteLaborItemOpen.set(false);
    this.laborItemToDelete.set(null);
  }

  submitDeleteLaborItem(): void {
    const item = this.laborItemToDelete();
    if (!item) return;

    this.isProcessing.set(true);
    this.laborBudgetService.deleteBudgetItem(item.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteLaborItemModal();
        this.refreshBudget();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // --- Modal Helper - Editar Obra ---
  openEditProjectModal(): void {
    this.isEditProjectModalOpen.set(true);
  }
}
