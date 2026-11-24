import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialCatalogService } from '../../../core/services/material-catalog.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../core/services/purchase-unit.service';
import { SupplierService } from '../../../core/services/supplier.service';
import {
  CreateMaterialCatalogItemDto,
  MaterialCatalogItem,
  UpdateMaterialCatalogItemDto,
} from '../../../core/models/material-catalog.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ClusterPaginationComponent } from '../../../shared/components/cluster-pagination/cluster-pagination.component';
import { CurrencyClpPipe } from '../../../shared/pipes/currency-clp.pipe';
import { PercentPipe } from '../../../shared/pipes/percent.pipe';
import { CompactNumberPipe } from '../../../shared/pipes/compact-number.pipe';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-material-catalog-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    ClusterPaginationComponent,
    CurrencyClpPipe,
    PercentPipe,
    CompactNumberPipe,
    CustomSelectComponent,
    InfoTooltipComponent,
  ],
  templateUrl: './material-catalog-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialCatalogListComponent implements OnInit {
  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);
  protected readonly supplierService = inject(SupplierService);

  viewMode = signal<'grouped' | 'table'>('grouped');
  searchTerm = signal<string>('');
  selectedSubcategoryFilter = signal<number | null>(null);
  selectedSupplierFilter = signal<number | null>(null);
  onlyActiveFilter = signal<boolean>(false);

  // Computed Select Options
  readonly subcategoryFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las subcategorías', value: null },
    ...this.subcategoryService.subcategories().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly supplierFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todos los proveedores', value: null },
    ...this.supplierService.suppliers().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly supplierFormOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Sin proveedor específico (Genérico)', value: null },
    ...this.supplierService.suppliers().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly materialSubcategories = computed(() =>
    this.subcategoryService.getSubcategoriesForCategoryType('materials')
  );

  readonly subcategoryFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.materialSubcategories().map((s) => ({
      label: s.name,
      value: s.id,
    }))
  );

  readonly uomFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.uomService.units().map((u) => ({
      label: `${u.name} (${u.abbreviation})`,
      value: u.id,
    }))
  );

  readonly puFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.puService.units().map((p) => ({
      label: `${p.name} (${p.abbreviation})`,
      value: p.id,
    }))
  );

  // Modals state
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  isProcessing = signal(false);

  // Form states
  formSubcategoryId = signal<number>(0);
  formSupplierId = signal<number | null>(null);
  formName = signal<string>('');
  formDescription = signal<string>('');
  formUnitMeasureId = signal<number>(0);
  formUnitPurchaseId = signal<number>(0);
  formConversionFactor = signal<number | null>(1);
  formWeight = signal<number | null>(null);
  formWastePct = signal<number>(0);
  formPrice = signal<number | null>(null);
  formIsActive = signal<boolean>(true);

  itemToEdit = signal<MaterialCatalogItem | null>(null);
  itemToDelete = signal<MaterialCatalogItem | null>(null);

  // --- Estado de Acordeón por Subcategoría (Todos expandidos por defecto) ---
  readonly collapsedSubcategories = signal<Set<number>>(new Set());

  readonly isAllSubcategoriesCollapsed = computed(() => {
    const groups = this.filteredGrouped();
    if (groups.length === 0) return false;
    return groups.every((g) => this.collapsedSubcategories().has(g.subcategory_id));
  });

  toggleSubcategoryCollapse(subcategoryId: number): void {
    this.collapsedSubcategories.update((set) => {
      const next = new Set(set);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  }

  isSubcategoryCollapsed(subcategoryId: number): boolean {
    return this.collapsedSubcategories().has(subcategoryId);
  }

  toggleAllSubcategoriesCollapse(): void {
    const groups = this.filteredGrouped();
    const isAnyOpen = groups.some((g) => !this.isSubcategoryCollapsed(g.subcategory_id));
    if (isAnyOpen) {
      const allIds = new Set(groups.map((g) => g.subcategory_id));
      this.collapsedSubcategories.set(allIds);
    } else {
      this.collapsedSubcategories.set(new Set());
    }
  }

  // --- Paginación Aislada por Cluster (10 ítems por página) ---
  readonly clusterPages = signal<Map<number, number>>(new Map());

  getClusterPage(subcategoryId: number): number {
    return this.clusterPages().get(subcategoryId) || 1;
  }

  setClusterPage(subcategoryId: number, page: number): void {
    this.clusterPages.update((map) => {
      const next = new Map(map);
      next.set(subcategoryId, page);
      return next;
    });
  }

  getPagedItems(items: MaterialCatalogItem[], page: number, pageSize = 10): MaterialCatalogItem[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  // Filtered Flat Catalog Items
  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const subcatId = this.selectedSubcategoryFilter();
    const supplierId = this.selectedSupplierFilter();
    const onlyActive = this.onlyActiveFilter();
    let list = this.catalogService.items();

    if (onlyActive) {
      list = list.filter((i) => i.is_active);
    }
    if (subcatId) {
      list = list.filter((i) => i.subcategory === subcatId);
    }
    if (supplierId) {
      list = list.filter((i) => i.supplier === supplierId);
    }
    if (term) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.description?.toLowerCase().includes(term) ||
          i.subcategory_detail?.name.toLowerCase().includes(term) ||
          (i.supplier_name && i.supplier_name.toLowerCase().includes(term)) ||
          i.id.toString().includes(term)
      );
    }

    return list;
  });

  // Filtered Grouped Items
  filteredGrouped = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const subcatId = this.selectedSubcategoryFilter();
    const supplierId = this.selectedSupplierFilter();
    const onlyActive = this.onlyActiveFilter();
    let grouped = this.catalogService.groupedItems();

    if (subcatId) {
      grouped = grouped.filter((g) => g.subcategory_id === subcatId);
    }

    return grouped
      .map((g) => {
        let items = g.items;
        if (onlyActive) {
          items = items.filter((i) => i.is_active);
        }
        if (supplierId) {
          items = items.filter((i) => i.supplier === supplierId);
        }
        if (term) {
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(term) ||
              i.description?.toLowerCase().includes(term) ||
              (i.supplier_name && i.supplier_name.toLowerCase().includes(term))
          );
        }
        return {
          ...g,
          items,
          items_count: items.length,
        };
      })
      .filter((g) => g.items.length > 0 || (term === '' && !onlyActive && !supplierId));
  });

  ngOnInit(): void {
    this.refreshCatalog();
    this.subcategoryService.loadSubcategories().subscribe();
    this.uomService.loadUnits().subscribe();
    this.puService.loadUnits().subscribe();
    this.supplierService.loadSuppliers('material').subscribe();
  }

  refreshCatalog(): void {
    this.catalogService.loadCatalog().subscribe();
    this.catalogService.loadGroupedBySubcategory().subscribe();
  }

  // --- Create ---
  openCreateModal(presetSubcategoryId?: number): void {
    const subcats = this.subcategoryService.subcategories();
    const uoms = this.uomService.units();
    const pus = this.puService.units();

    this.formSubcategoryId.set(presetSubcategoryId || (subcats[0]?.id ?? 0));
    this.formSupplierId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formUnitMeasureId.set(uoms[0]?.id ?? 0);
    this.formUnitPurchaseId.set(pus[0]?.id ?? 0);
    this.formConversionFactor.set(1);
    this.formWeight.set(null);
    this.formWastePct.set(0);
    this.formPrice.set(null);
    this.formIsActive.set(true);

    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    const subcategory = Number(this.formSubcategoryId());
    const name = this.formName().trim();
    const unit_measure = Number(this.formUnitMeasureId());
    const unit_purchase = Number(this.formUnitPurchaseId());

    if (!subcategory || !name || !unit_measure || !unit_purchase) return;

    const dto: CreateMaterialCatalogItemDto = {
      subcategory,
      supplier: this.formSupplierId() ? Number(this.formSupplierId()) : null,
      name,
      description: this.formDescription().trim(),
      unit_measure,
      unit_purchase,
      conversion_factor: this.formConversionFactor(),
      weight_per_purchase_unit: this.formWeight(),
      waste_pct: (this.formWastePct() || 0) / 100,
      price_per_purchase_unit: this.formPrice(),
      is_active: this.formIsActive(),
    };

    this.isProcessing.set(true);
    this.catalogService.createCatalogItem(dto).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeCreateModal();
        this.refreshCatalog();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // --- Edit ---
  openEditModal(item: MaterialCatalogItem): void {
    this.itemToEdit.set(item);
    this.formSubcategoryId.set(item.subcategory);
    this.formSupplierId.set(item.supplier ?? null);
    this.formName.set(item.name);
    this.formDescription.set(item.description || '');
    this.formUnitMeasureId.set(item.unit_measure);
    this.formUnitPurchaseId.set(item.unit_purchase);
    this.formConversionFactor.set(
      item.conversion_factor !== null ? Number(item.conversion_factor) : null
    );
    this.formWeight.set(
      item.weight_per_purchase_unit !== null ? Number(item.weight_per_purchase_unit) : null
    );
    this.formWastePct.set((Number(item.waste_pct) || 0) * 100);
    this.formPrice.set(
      item.price_per_purchase_unit !== null ? Number(item.price_per_purchase_unit) : null
    );
    this.formIsActive.set(item.is_active);

    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.itemToEdit.set(null);
  }

  submitEdit(): void {
    const item = this.itemToEdit();
    if (!item) return;

    const dto: UpdateMaterialCatalogItemDto = {
      subcategory: Number(this.formSubcategoryId()),
      supplier: this.formSupplierId() ? Number(this.formSupplierId()) : null,
      name: this.formName().trim(),
      description: this.formDescription().trim(),
      unit_measure: Number(this.formUnitMeasureId()),
      unit_purchase: Number(this.formUnitPurchaseId()),
      conversion_factor: this.formConversionFactor(),
      weight_per_purchase_unit: this.formWeight(),
      waste_pct: (this.formWastePct() || 0) / 100,
      price_per_purchase_unit: this.formPrice(),
      is_active: this.formIsActive(),
    };

    this.isProcessing.set(true);
    this.catalogService.updateCatalogItem(item.id, dto).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeEditModal();
        this.refreshCatalog();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  // --- Delete ---
  openDeleteModal(item: MaterialCatalogItem): void {
    this.itemToDelete.set(item);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  submitDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.isProcessing.set(true);
    this.catalogService.deleteCatalogItem(item.id).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.closeDeleteModal();
        this.refreshCatalog();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }
}
