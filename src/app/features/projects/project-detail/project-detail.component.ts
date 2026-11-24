import { ChangeDetectionStrategy, Component, computed, HostListener, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { CategoryService } from '../../../core/services/category.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { MaterialCatalogService } from '../../../core/services/material-catalog.service';
import { LaborCatalogService } from '../../../core/services/labor-catalog.service';
import { UnifiedBudgetService } from '../../../core/services/unified-budget.service';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../core/services/purchase-unit.service';
import { ConstructionStageService } from '../../../core/services/construction-stage.service';
import { BudgetCategoryType, BudgetItem, BudgetStageGrouped, BudgetSubcategoryCluster, BudgetSummaryCategoryBreakdown } from '../../../core/models/budget-item.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CurrencyClpPipe, UsdPipe } from '../../../shared/pipes/currency-clp.pipe';
import { WeightKgPipe } from '../../../shared/pipes/weight-kg.pipe';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';

import { AddFromCatalogModalComponent } from './components/add-from-catalog-modal/add-from-catalog-modal.component';
import { AddCustomItemModalComponent } from './components/add-custom-item-modal/add-custom-item-modal.component';
import { EditBudgetItemModalComponent } from './components/edit-budget-item-modal/edit-budget-item-modal.component';
import { BudgetItemsTableComponent } from './components/budget-items-table/budget-items-table.component';
import { EditProjectModalComponent } from './components/edit-project-modal/edit-project-modal.component';
import { ClusterPaginationComponent } from '../../../shared/components/cluster-pagination/cluster-pagination.component';
import { FloatingPanelDirective } from '../../../shared/floating/floating-panel.directive';

export interface BudgetFamilyMenuOption {
  type: BudgetCategoryType;
  label: string;
  shortLabel: string;
  badge?: string;
  description: string;
}

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
    InfoTooltipComponent,
    AddFromCatalogModalComponent,
    AddCustomItemModalComponent,
    EditBudgetItemModalComponent,
    BudgetItemsTableComponent,
    EditProjectModalComponent,
    ClusterPaginationComponent,
    FloatingPanelDirective,
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
  protected readonly laborCatalogService = inject(LaborCatalogService);
  protected readonly budgetService = inject(UnifiedBudgetService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);
  protected readonly stageService = inject(ConstructionStageService);

  readonly familyOptions: BudgetFamilyMenuOption[] = [
    {
      type: 'materials',
      label: 'Materiales e Insumos',
      shortLabel: 'M',
      description: 'Cómputo métrico con factor de equivalencia, merma, redondeo a unidades enteras y peso logístico.',
    },
    {
      type: 'labor',
      label: 'Mano de Obra',
      shortLabel: 'O',
      description: 'Ítems por metrado o contrato global con contratistas e incidencia directa en costo por m².',
    },
    {
      type: 'operating',
      label: 'Gastos Operativos (G.O.)',
      shortLabel: 'G',
      description: 'Equipos, herramientas, transporte y logística de obra por porcentaje o asignación directa.',
    },
    {
      type: 'administrative',
      label: 'Gastos Administrativos (G.A.)',
      shortLabel: 'A',
      description: 'Dirección técnica, permisos, trámites, seguros e impuestos por porcentaje o monto fijo.',
    },
  ];

  readonly activeObraModule = signal<'budget'>('budget');
  readonly obraModuleTabs = [
    { id: 'budget' as const, label: 'Presupuesto', soon: false, tooltip: '' },
    {
      id: 'rendiciones' as const,
      label: 'Rendiciones',
      soon: true,
      tooltip: 'Registro y rendición de gastos reales ejecutados en obra (próximo módulo).',
    },
    {
      id: 'caja_chica' as const,
      label: 'Caja Chica',
      soon: true,
      tooltip: 'Control de fondos fijos, reposiciones y gastos menores en faena (próximo módulo).',
    },
    {
      id: 'analisis' as const,
      label: 'Análisis / Comparativa',
      soon: true,
      tooltip: 'Comparativa Presupuestado vs. Ejecutado y análisis de desviaciones (próximo módulo).',
    },
  ];

  readonly visibleFamilyOptions = computed<BudgetFamilyMenuOption[]>(() => {
    const categories = this.categoryService.categories();
    const activeTypes: BudgetCategoryType[] = ['materials', 'labor'];
    return activeTypes.map((type) => {
      const base = this.familyOptions.find((f) => f.type === type)!;
      const cat = categories.find((c) => c.code === type);
      return {
        ...base,
        label: cat?.name || base.label,
        shortLabel: (cat?.name || base.label).charAt(0).toUpperCase(),
      };
    });
  });

  readonly activeCategoryType = signal<BudgetCategoryType>('materials');
  readonly budgetViewMode = signal<'grouped' | 'flat'>('grouped');
  readonly budgetSearchTerm = signal<string>('');
  readonly openStageMenuId = signal<string | null>(null);
  readonly openStageMenuAnchor = signal<HTMLElement | null>(null);

  // Filtro por Etapa y Acordeón Colapsable Jerárquico (Todos expandidos por defecto)
  readonly collapsedStages = signal<Set<string>>(new Set());
  readonly collapsedSubcategories = signal<Set<string>>(new Set());
  readonly selectedStageFilter = signal<number | null>(null);
  readonly stageSubcategoryFilters = signal<Map<string, number | null>>(new Map());

  // Modals state & presets
  readonly isFromCatalogModalOpen = signal(false);
  readonly modalCatalogPresetGlobal = signal(false);
  readonly isCustomItemModalOpen = signal(false);
  readonly isEditItemModalOpen = signal(false);
  readonly isDeleteItemModalOpen = signal(false);
  readonly modalPresetStageId = signal<number | null>(null);
  readonly modalPresetSubcategoryId = signal<number | null>(null);
  readonly itemToEdit = signal<BudgetItem | null>(null);
  readonly itemToDelete = signal<BudgetItem | null>(null);

  // Modal state - Edición del Proyecto
  readonly isEditProjectModalOpen = signal(false);
  readonly isProcessing = signal(false);

  readonly projectIdNumber = computed(() => Number(this.id()) || 0);

  readonly activeFamilyMeta = computed(
    () => this.visibleFamilyOptions().find((f) => f.type === this.activeCategoryType()) || this.visibleFamilyOptions()[0]
  );

  // Consolidated Obra Totals from UnifiedBudgetService.summary()
  readonly projectTotalCostBs = computed<number>(() => {
    return Number(this.budgetService.summary()?.total_budget_bs) || 0;
  });

  readonly projectTotalCostUsd = computed<number>(() => {
    return Number(this.budgetService.summary()?.total_budget_usd) || 0;
  });

  readonly hasBuiltArea = computed<boolean>(() => {
    return (Number(this.projectService.selectedProject()?.built_area) || 0) > 0;
  });

  readonly activeCategoryBreakdown = computed<BudgetSummaryCategoryBreakdown | null>(() => {
    const sum = this.budgetService.summary();
    if (!sum) return null;
    return sum[this.activeCategoryType()] || null;
  });

  getFamilyBreakdown(type: BudgetCategoryType): BudgetSummaryCategoryBreakdown | null {
    const sum = this.budgetService.summary();
    return sum ? sum[type] : null;
  }

  getFamilyPercentage(type: BudgetCategoryType): number {
    const total = this.projectTotalCostBs();
    if (total <= 0) return 0;
    const brk = this.getFamilyBreakdown(type);
    const val = Number(brk?.total_cost_bs) || 0;
    return Math.min(100, Math.round((val / total) * 1000) / 10);
  }

  getProjectStatusLabel(status?: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Finalizada';
      default:
        return 'En Presupuesto';
    }
  }

  toggleStageMenu(stageKey: string, event: Event): void {
    event.stopPropagation();
    if (this.openStageMenuId() === stageKey) {
      this.closeStageMenu();
      return;
    }
    this.openStageMenuAnchor.set((event.currentTarget as HTMLElement) ?? null);
    this.openStageMenuId.set(stageKey);
  }

  closeStageMenu(stageKey?: string): void {
    if (stageKey !== undefined && this.openStageMenuId() !== stageKey) {
      return;
    }
    this.openStageMenuId.set(null);
    this.openStageMenuAnchor.set(null);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openStageMenuId() !== null) {
      this.closeStageMenu();
    }
  }

  // Filtered flat budget items
  readonly filteredFlatItems = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const stageId = this.selectedStageFilter();
    let list = this.budgetService.items();

    if (stageId !== null) {
      list = list.filter((item) => (item.stage ?? item.stage_id) === stageId);
    }
    if (!term) return list;

    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.detail && item.detail.toLowerCase().includes(term)) ||
        (item.contractor_name && item.contractor_name.toLowerCase().includes(term)) ||
        (item.supplier_name && item.supplier_name.toLowerCase().includes(term)) ||
        (item.subcategory_name && item.subcategory_name.toLowerCase().includes(term))
    );
  });

  isStageGroupedFamily(): boolean {
    const t = this.activeCategoryType();
    return t === 'materials' || t === 'labor';
  }

  // --- Filtros e Indexación Jerárquica por Etapa y Subcategoría (Macro/Micro UC-005) ---
  readonly filteredGroupedStages = computed<BudgetStageGrouped[]>(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const stageFilter = this.selectedStageFilter();
    const stages = this.budgetService.stagesGrouped();
    if (!stages || stages.length === 0) return [];

    return stages
      .filter((st) => {
        if (stageFilter === null) return true;
        return st.stage_id === stageFilter;
      })
      .map((st) => {
        if (!term) return st;

        const stageMatches = st.stage_name.toLowerCase().includes(term);

        const filteredSubcats = st.subcategories
          .map((sub) => {
            const subMatches = sub.subcategory_name.toLowerCase().includes(term);
            const filteredItems = sub.items.filter(
              (item) =>
                stageMatches ||
                subMatches ||
                item.name.toLowerCase().includes(term) ||
                (item.detail && item.detail.toLowerCase().includes(term)) ||
                (item.contractor_name && item.contractor_name.toLowerCase().includes(term)) ||
                (item.supplier_name && item.supplier_name.toLowerCase().includes(term)) ||
                (item.subcategory_name && item.subcategory_name.toLowerCase().includes(term))
            );

            return {
              ...sub,
              items: filteredItems,
              items_count: filteredItems.length,
            };
          })
          .filter((sub) => sub.items.length > 0 || sub.subcategory_name.toLowerCase().includes(term));

        const totalItemsCount = filteredSubcats.reduce((acc, sub) => acc + sub.items.length, 0);

        return {
          ...st,
          subcategories: filteredSubcats,
          items_count: totalItemsCount,
        };
      })
      .filter((st) => st.subcategories.length > 0 || (term && st.stage_name.toLowerCase().includes(term)));
  });

  getFilteredSubcategories(stage: BudgetStageGrouped): BudgetSubcategoryCluster[] {
    const filterSubcatId = this.getStageSubcategoryFilter(stage.stage_id);
    if (filterSubcatId === null) {
      return stage.subcategories;
    }
    return stage.subcategories.filter((s) => s.subcategory_id === filterSubcatId);
  }

  // Filtered grouped budget para familias indirectas (Gastos Operativos y Administrativos)
  readonly filteredGroupedBudget = computed(() => {
    const term = this.budgetSearchTerm().toLowerCase().trim();
    const stageId = this.selectedStageFilter();
    const groups = this.budgetService.groupedItems();
    if (!groups || groups.length === 0) return [];

    const exchangeRate = Number(this.projectService.selectedProject()?.exchange_rate) || 6.97;

    return groups
      .map((g) => {
        let filteredItems = g.items;

        if (stageId !== null) {
          filteredItems = filteredItems.filter((item) => (item.stage ?? item.stage_id) === stageId);
        }

        if (term) {
          filteredItems = filteredItems.filter(
            (item) =>
              item.name.toLowerCase().includes(term) ||
              (item.detail && item.detail.toLowerCase().includes(term)) ||
              (item.contractor_name && item.contractor_name.toLowerCase().includes(term)) ||
              (item.supplier_name && item.supplier_name.toLowerCase().includes(term))
          );
        }

        if (!term && stageId === null) {
          return {
            ...g,
            subtotal_cost_num: Number(g.subtotal_cost_bs) || 0,
            subtotal_usd_num: Number(g.subtotal_cost_usd) || 0,
            subtotal_weight_num: Number(g.subtotal_weight_kg) || 0,
            units_summary: g.total_purchase_units_summary || this.computeUnitsSummary(filteredItems),
          };
        }

        const subtotalCost = filteredItems.reduce(
          (acc, item) => acc + (Number(item.estimated_cost) || 0),
          0
        );
        const subtotalWeight = filteredItems.reduce(
          (acc, item) => acc + (Number(item.weight_total) || 0),
          0
        );
        const subtotalCostUsd =
          exchangeRate > 0 ? Number((subtotalCost / exchangeRate).toFixed(2)) : 0;

        return {
          ...g,
          items: filteredItems,
          items_count: filteredItems.length,
          subtotal_cost_num: subtotalCost,
          subtotal_usd_num: subtotalCostUsd,
          subtotal_weight_num: subtotalWeight,
          units_summary: this.computeUnitsSummary(filteredItems),
        };
      })
      .filter((g) => g.items.length > 0 || (term && g.subcategory_name.toLowerCase().includes(term)));
  });

  ngOnInit(): void {
    const projectId = this.projectIdNumber();
    if (projectId) {
      this.projectService.getProjectById(projectId).subscribe();
      this.refreshBudget();
    }
    this.categoryService.loadCategories().subscribe();
    this.subcategoryService.loadSubcategories().subscribe();
    this.catalogService.loadCatalog().subscribe();
    this.laborCatalogService.loadCatalog().subscribe();
    this.uomService.loadUnits().subscribe();
    this.puService.loadUnits().subscribe();
    this.stageService.loadStages().subscribe();
  }

  refreshBudget(): void {
    const projectId = this.projectIdNumber();
    if (!projectId) return;

    const catType = this.activeCategoryType();
    this.projectService.getProjectById(projectId).subscribe();
    this.budgetService.loadSummary(projectId).subscribe();
    if (this.isStageGroupedFamily()) {
      this.budgetService.loadGroupedByStage(projectId, catType).subscribe();
    } else {
      this.budgetService.loadGrouped(projectId, catType).subscribe();
    }
    this.budgetService.loadItems(projectId, { category_type: catType }).subscribe();
  }

  selectCategoryType(type: BudgetCategoryType): void {
    if (this.activeCategoryType() === type) return;
    this.activeCategoryType.set(type);
    this.collapsedStages.set(new Set());
    this.collapsedSubcategories.set(new Set());
    this.stageSubcategoryFilters.set(new Map());
    this.clusterPages.set(new Map());

    const projectId = this.projectIdNumber();
    if (!projectId) return;

    if (type === 'materials' || type === 'labor') {
      this.budgetService.loadGroupedByStage(projectId, type).subscribe();
    } else {
      this.budgetService.loadGrouped(projectId, type).subscribe();
    }
    this.budgetService.loadItems(projectId, { category_type: type }).subscribe();
  }

  selectStageFilter(stageId: number | null): void {
    this.selectedStageFilter.set(stageId);
  }

  // --- Claves Compuestas y Estado de Acordeón ---
  getStageKey(stageId: number | null | undefined): string {
    return stageId !== null && stageId !== undefined ? String(stageId) : 'unassigned';
  }

  getStageSubcatKey(stageId: number | null | undefined, subcatId: number | null | undefined): string {
    const sKey = this.getStageKey(stageId);
    const subKey = subcatId !== null && subcatId !== undefined ? String(subcatId) : 'none';
    return `${sKey}_${subKey}`;
  }

  // --- Nivel Macro: Acordeón por Etapa ---
  isStageCollapsed(stageId: number | null | undefined): boolean {
    return this.collapsedStages().has(this.getStageKey(stageId));
  }

  toggleStageCollapse(stageId: number | null | undefined): void {
    const key = this.getStageKey(stageId);
    this.collapsedStages.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  readonly isAllStagesCollapsed = computed(() => {
    const stages = this.filteredGroupedStages();
    if (stages.length === 0) return false;
    return stages.every((st) => this.isStageCollapsed(st.stage_id));
  });

  toggleAllStagesCollapse(): void {
    const stages = this.filteredGroupedStages();
    const isAnyOpen = stages.some((st) => !this.isStageCollapsed(st.stage_id));
    if (isAnyOpen) {
      const allKeys = new Set(stages.map((st) => this.getStageKey(st.stage_id)));
      this.collapsedStages.set(allKeys);
    } else {
      this.collapsedStages.set(new Set());
    }
  }

  // --- Nivel Micro: Acordeón por Subcategoría dentro de Etapa ---
  isSubcategoryCollapsed(stageId: number | null | undefined, subcatId: number | null | undefined): boolean {
    return this.collapsedSubcategories().has(this.getStageSubcatKey(stageId, subcatId));
  }

  toggleSubcategoryCollapse(stageId: number | null | undefined, subcatId: number | null | undefined): void {
    const key = this.getStageSubcatKey(stageId, subcatId);
    this.collapsedSubcategories.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  isAllSubcategoriesInStageCollapsed(stage: BudgetStageGrouped): boolean {
    if (!stage.subcategories || stage.subcategories.length === 0) return false;
    return stage.subcategories.every((sub) =>
      this.isSubcategoryCollapsed(stage.stage_id, sub.subcategory_id)
    );
  }

  toggleAllSubcategoriesInStage(stage: BudgetStageGrouped): void {
    const isAnyOpen = stage.subcategories.some(
      (sub) => !this.isSubcategoryCollapsed(stage.stage_id, sub.subcategory_id)
    );
    this.collapsedSubcategories.update((set) => {
      const next = new Set(set);
      for (const sub of stage.subcategories) {
        const key = this.getStageSubcatKey(stage.stage_id, sub.subcategory_id);
        if (isAnyOpen) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  }

  // Filtro por subcategoría específico de una etapa
  getStageSubcategoryFilter(stageId: number | null | undefined): number | null {
    return this.stageSubcategoryFilters().get(this.getStageKey(stageId)) ?? null;
  }

  setStageSubcategoryFilter(stageId: number | null | undefined, subcatId: number | null): void {
    const key = this.getStageKey(stageId);
    this.stageSubcategoryFilters.update((map) => {
      const next = new Map(map);
      next.set(key, subcatId);
      return next;
    });
  }

  // Fallback para familias no agrupadas por etapa (Gastos Operativos / Administrativos)
  readonly isAllSubcategoriesCollapsed = computed(() => {
    const groups = this.filteredGroupedBudget();
    if (groups.length === 0) return false;
    return groups.every((g) => this.isSubcategoryCollapsed(null, g.subcategory_id));
  });

  toggleAllSubcategoriesCollapse(): void {
    const groups = this.filteredGroupedBudget();
    const isAnyOpen = groups.some((g) => !this.isSubcategoryCollapsed(null, g.subcategory_id));
    if (isAnyOpen) {
      const allKeys = new Set(groups.map((g) => this.getStageSubcatKey(null, g.subcategory_id)));
      this.collapsedSubcategories.set(allKeys);
    } else {
      this.collapsedSubcategories.set(new Set());
    }
  }

  // --- Paginación Aislada por Cluster (10 partidas por cluster) ---
  readonly clusterPages = signal<Map<string, number>>(new Map());

  getClusterPage(stageId: number | null | undefined, subcategoryId: number | null | undefined): number {
    const key = this.getStageSubcatKey(stageId, subcategoryId);
    return this.clusterPages().get(key) || 1;
  }

  setClusterPage(stageId: number | null | undefined, subcategoryId: number | null | undefined, page: number): void {
    const key = this.getStageSubcatKey(stageId, subcategoryId);
    this.clusterPages.update((map) => {
      const next = new Map(map);
      next.set(key, page);
      return next;
    });
  }

  getPagedItems(items: BudgetItem[], page: number, pageSize = 10): BudgetItem[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  computeUnitsSummary(items: BudgetItem[]): string {
    const counter: Record<string, number> = {};
    for (const it of items) {
      const unit = it.unit_purchase_abbr || it.unit_measure_abbr || 'u';
      const qty = Number(it.quantity_purchase || it.quantity_obra) || 0;
      if (qty > 0) {
        counter[unit] = (counter[unit] || 0) + qty;
      }
    }
    const parts = Object.entries(counter).map(
      ([unit, qty]) => `${Number.isInteger(qty) ? qty : qty.toFixed(1)} ${unit}`
    );
    return parts.length > 0 ? parts.join(' + ') : '';
  }

  supportsCatalog(): boolean {
    const t = this.activeCategoryType();
    return t === 'materials' || t === 'labor';
  }

  activeCatalogType(): 'materials' | 'labor' {
    return this.activeCategoryType() === 'labor' ? 'labor' : 'materials';
  }

  // --- Modal Helpers con Presets de Etapa y Subcategoría ---
  openFromCatalogModal(presetStageId?: number | null, presetSubcatId?: number | null, isGlobal = false): void {
    this.closeStageMenu();
    const stageToPreset = presetStageId !== undefined ? presetStageId : (this.selectedStageFilter() ?? null);
    this.modalPresetStageId.set(stageToPreset);
    this.modalPresetSubcategoryId.set(presetSubcatId ?? null);
    this.modalCatalogPresetGlobal.set(isGlobal);
    this.isFromCatalogModalOpen.set(true);
  }

  openCustomItemModal(presetStageId?: number | null, presetSubcatId?: number | null): void {
    this.closeStageMenu();
    const stageToPreset = presetStageId !== undefined ? presetStageId : (this.selectedStageFilter() ?? null);
    this.modalPresetStageId.set(stageToPreset);
    this.modalPresetSubcategoryId.set(presetSubcatId ?? null);
    this.isCustomItemModalOpen.set(true);
  }

  openEditItemModal(item: BudgetItem): void {
    this.itemToEdit.set(item);
    this.isEditItemModalOpen.set(true);
  }

  openDeleteItemModal(item: BudgetItem): void {
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
    this.budgetService.deleteItem(item.id).subscribe({
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

  openEditProjectModal(): void {
    this.isEditProjectModalOpen.set(true);
  }
}
