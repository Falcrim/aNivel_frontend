import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaborCatalogService } from '../../../core/services/labor-catalog.service';
import { SubcategoryService } from '../../../core/services/subcategory.service';
import { CategoryService } from '../../../core/services/category.service';
import { UnitOfMeasureService } from '../../../core/services/unit-of-measure.service';
import {
  CreateLaborCatalogItemDto,
  LaborCatalogGrouped,
  LaborCatalogItem,
  UpdateLaborCatalogItemDto,
} from '../../../core/models/labor-catalog.model';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyClpPipe } from '../../../shared/pipes/currency-clp.pipe';
import { CustomSelectComponent, CustomSelectOption } from '../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-labor-catalog-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    CurrencyClpPipe,
    CustomSelectComponent,
  ],
  templateUrl: './labor-catalog-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaborCatalogListComponent implements OnInit {
  protected readonly catalogService = inject(LaborCatalogService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly uomService = inject(UnitOfMeasureService);

  viewMode = signal<'grouped' | 'table'>('grouped');
  searchTerm = signal<string>('');
  selectedSubcategoryFilter = signal<number | null>(null);
  onlyActiveFilter = signal<boolean>(false);

  // Subcategorías pertenecientes a Mano de Obra
  readonly laborSubcategories = computed(() => {
    const all = this.subcategoryService.subcategories();
    const laborCat = this.categoryService
      .categories()
      .find((c) => c.name.toLowerCase().includes('mano'));
    if (laborCat) {
      const filtered = all.filter((s) => s.category === laborCat.id);
      return filtered.length > 0 ? filtered : all;
    }
    return all;
  });

  // Computed Select Options
  readonly subcategoryFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las etapas / subcategorías', value: null },
    ...this.laborSubcategories().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly subcategoryFormOptions = computed<CustomSelectOption<number>[]>(() =>
    this.laborSubcategories().map((s) => ({
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

  // Modals state
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isDeleteModalOpen = signal(false);
  isProcessing = signal(false);

  // Form states
  formSubcategoryId = signal<number>(0);
  formName = signal<string>('');
  formDetail = signal<string>('');
  formUnitId = signal<number>(0);
  formSuggestedCost = signal<number | null>(null);
  formContractorType = signal<string>('');
  formIsActive = signal<boolean>(true);

  itemToEdit = signal<LaborCatalogItem | null>(null);
  itemToDelete = signal<LaborCatalogItem | null>(null);

  // Filtered Flat Catalog Items
  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const subcatId = this.selectedSubcategoryFilter();
    const onlyActive = this.onlyActiveFilter();
    let list = this.catalogService.items();

    if (onlyActive) {
      list = list.filter((i) => i.is_active);
    }
    if (subcatId) {
      list = list.filter((i) => i.subcategory === subcatId);
    }
    if (term) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          (i.detail && i.detail.toLowerCase().includes(term)) ||
          (i.contractor_type && i.contractor_type.toLowerCase().includes(term)) ||
          (i.subcategory_detail?.name && i.subcategory_detail.name.toLowerCase().includes(term)) ||
          i.id.toString().includes(term)
      );
    }

    return list;
  });

  // Filtered Grouped Items by Subcategory
  readonly filteredGrouped = computed<LaborCatalogGrouped[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const subcatId = this.selectedSubcategoryFilter();
    const onlyActive = this.onlyActiveFilter();
    const items = this.catalogService.items();
    const subcats = this.laborSubcategories();

    // Map by subcategory ID
    const groupsMap = new Map<number, LaborCatalogItem[]>();

    for (const item of items) {
      if (onlyActive && !item.is_active) continue;
      if (subcatId && item.subcategory !== subcatId) continue;
      if (term) {
        const matches =
          item.name.toLowerCase().includes(term) ||
          (item.detail && item.detail.toLowerCase().includes(term)) ||
          (item.contractor_type && item.contractor_type.toLowerCase().includes(term)) ||
          (item.subcategory_detail?.name && item.subcategory_detail.name.toLowerCase().includes(term));
        if (!matches) continue;
      }

      const list = groupsMap.get(item.subcategory) || [];
      list.push(item);
      groupsMap.set(item.subcategory, list);
    }

    const grouped: LaborCatalogGrouped[] = [];

    // Ensure all matching subcategories appear or only those with items
    for (const sub of subcats) {
      if (subcatId && sub.id !== subcatId) continue;
      const subItems = groupsMap.get(sub.id) || [];
      if (subItems.length > 0 || (!term && !onlyActive && !subcatId)) {
        grouped.push({
          subcategory_id: sub.id,
          subcategory_name: sub.name,
          items_count: subItems.length,
          items: subItems,
        });
      }
    }

    return grouped.filter((g) => g.items.length > 0 || (term === '' && !onlyActive));
  });

  ngOnInit(): void {
    this.refreshCatalog();
    this.categoryService.loadCategories().subscribe();
    this.subcategoryService.loadSubcategories().subscribe();
    this.uomService.loadUnits().subscribe();
  }

  refreshCatalog(): void {
    this.catalogService.loadCatalog().subscribe();
  }

  // --- Create ---
  openCreateModal(presetSubcategoryId?: number): void {
    const subcats = this.laborSubcategories();
    const uoms = this.uomService.units();

    this.formSubcategoryId.set(presetSubcategoryId || (subcats[0]?.id ?? 0));
    this.formName.set('');
    this.formDetail.set('');
    this.formUnitId.set(uoms[0]?.id ?? 0);
    this.formSuggestedCost.set(null);
    this.formContractorType.set('');
    this.formIsActive.set(true);

    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    const subcategory = Number(this.formSubcategoryId());
    const name = this.formName().trim();
    const unit = Number(this.formUnitId());
    const suggested_cost = Number(this.formSuggestedCost()) || 0;

    if (!subcategory || !name || !unit) return;

    const dto: CreateLaborCatalogItemDto = {
      subcategory,
      name,
      detail: this.formDetail().trim(),
      unit,
      suggested_cost,
      contractor_type: this.formContractorType().trim(),
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
  openEditModal(item: LaborCatalogItem): void {
    this.itemToEdit.set(item);
    this.formSubcategoryId.set(item.subcategory);
    this.formName.set(item.name);
    this.formDetail.set(item.detail || '');
    this.formUnitId.set(item.unit);
    this.formSuggestedCost.set(Number(item.suggested_cost) || 0);
    this.formContractorType.set(item.contractor_type || '');
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

    const dto: UpdateLaborCatalogItemDto = {
      subcategory: Number(this.formSubcategoryId()),
      name: this.formName().trim(),
      detail: this.formDetail().trim(),
      unit: Number(this.formUnitId()),
      suggested_cost: Number(this.formSuggestedCost()) || 0,
      contractor_type: this.formContractorType().trim(),
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
  openDeleteModal(item: LaborCatalogItem): void {
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
