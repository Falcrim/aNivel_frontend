import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialCatalogService } from '../../../../../core/services/material-catalog.service';
import { LaborCatalogService } from '../../../../../core/services/labor-catalog.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { UnifiedBudgetService, FromCatalogUnifiedPayload } from '../../../../../core/services/unified-budget.service';
import { SupplierService } from '../../../../../core/services/supplier.service';
import { ConstructionStageService } from '../../../../../core/services/construction-stage.service';
import { MaterialCatalogItem } from '../../../../../core/models/material-catalog.model';
import { LaborCatalogItem } from '../../../../../core/models/labor-catalog.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CurrencyClpPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { CompactNumberPipe, formatCompactDecimal } from '../../../../../shared/pipes/compact-number.pipe';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-add-from-catalog-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CurrencyClpPipe, CompactNumberPipe, CustomSelectComponent, InfoTooltipComponent],
  templateUrl: './add-from-catalog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFromCatalogModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly catalogType = input<'materials' | 'labor'>('materials');
  readonly presetSubcategoryId = input<number | null>(null);
  readonly presetStageId = input<number | null>(null);
  readonly presetIsGlobal = input<boolean>(false);

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly materialCatalogService = inject(MaterialCatalogService);
  protected readonly laborCatalogService = inject(LaborCatalogService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly supplierService = inject(SupplierService);
  protected readonly stageService = inject(ConstructionStageService);
  private readonly budgetService = inject(UnifiedBudgetService);

  // Filters & State
  readonly searchTerm = signal<string>('');
  readonly subcatFilter = signal<number | null>(null);
  readonly supplierFilter = signal<number | null>(null);
  readonly stageId = signal<number | null>(null);
  readonly selectedItemId = signal<number | null>(null);
  readonly selectedMaterial = signal<MaterialCatalogItem | null>(null);
  readonly selectedLabor = signal<LaborCatalogItem | null>(null);

  readonly isGlobal = signal<boolean>(false);
  readonly applyCeil = signal<boolean>(true);
  readonly quantityObra = signal<number | null>(null);
  readonly quantityPurchase = signal<number | null>(null);
  readonly wastePct = signal<number>(0);
  readonly priceOverride = signal<number | null>(null);
  readonly contractorName = signal<string>('');
  readonly detail = signal<string>('');
  readonly isProcessing = signal<boolean>(false);

  readonly stageOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Sin etapa específica', value: null },
    ...this.stageService.stages().map((st) => ({
      label: st.name,
      value: st.id,
    })),
  ]);

  readonly availableSubcategories = computed(() => {
    return this.subcategoryService.getSubcategoriesForCategoryType(this.catalogType());
  });

  readonly subcatFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las subcategorías', value: null },
    ...this.availableSubcategories().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly supplierFilterOptions = computed<CustomSelectOption<number | null>[]>(() => {
    const isMat = this.catalogType() === 'materials';
    return [
      { label: 'Todos los proveedores', value: null },
      ...this.supplierService
        .suppliers()
        .filter((s) =>
          isMat
            ? s.supplier_type === 'material' || s.supplier_type === 'both'
            : s.supplier_type === 'labor' || s.supplier_type === 'both'
        )
        .map((s) => ({
          label: s.name,
          value: s.id,
        })),
    ];
  });

  readonly filteredMaterialItems = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const subcatId = this.subcatFilter();
    const supId = this.supplierFilter();
    let list = this.materialCatalogService.items();

    if (subcatId) {
      list = list.filter((i) => i.subcategory === Number(subcatId));
    }
    if (supId) {
      list = list.filter((i) => i.supplier === Number(supId));
    }
    if (search) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          (i.description && i.description.toLowerCase().includes(search)) ||
          (i.supplier_name && i.supplier_name.toLowerCase().includes(search)) ||
          (i.subcategory_detail && i.subcategory_detail.name.toLowerCase().includes(search))
      );
    }
    return list;
  });

  readonly filteredLaborItems = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const subcatId = this.subcatFilter();
    const supId = this.supplierFilter();
    let list = this.laborCatalogService.items();

    if (subcatId) {
      list = list.filter((i) => i.subcategory === Number(subcatId));
    }
    if (supId) {
      list = list.filter((i) => i.supplier === Number(supId));
    }
    if (search) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          (i.detail && i.detail.toLowerCase().includes(search)) ||
          (i.contractor_type && i.contractor_type.toLowerCase().includes(search)) ||
          (i.supplier_name && i.supplier_name.toLowerCase().includes(search)) ||
          (i.subcategory_detail && i.subcategory_detail.name.toLowerCase().includes(search))
      );
    }
    return list;
  });

  readonly catalogItemOptions = computed<CustomSelectOption<number | null>[]>(() => {
    if (this.catalogType() === 'materials') {
      return this.filteredMaterialItems().map((item) => ({
        label: item.name,
        value: item.id,
        subtitle: `${item.subcategory_detail?.name || 'Subcat'}${item.supplier_name ? ' • ' + item.supplier_name : ''} — 1 ${item.unit_purchase_detail?.abbreviation || 'u'} = ${formatCompactDecimal(item.conversion_factor)} ${item.unit_measure_detail?.abbreviation || 'u'} — Ref: Bs ${item.price_per_purchase_unit || 0}`,
      }));
    } else {
      return this.filteredLaborItems().map((item) => ({
        label: item.name,
        value: item.id,
        subtitle: `${item.subcategory_detail?.name || 'Subcat'}${item.contractor_type ? ' • ' + item.contractor_type : ''} — Tarifa Ref: Bs ${item.suggested_cost || 0} / ${item.unit_detail?.abbreviation || 'u'}`,
      }));
    }
  });

  readonly availableCount = computed(() =>
    this.catalogType() === 'materials'
      ? this.filteredMaterialItems().length
      : this.filteredLaborItems().length
  );

  // Live Formula Computeds
  readonly liveNetQuantity = computed(() => {
    if (this.catalogType() === 'materials' && this.isGlobal()) {
      return this.quantityPurchase() || 0;
    }
    const qty = this.quantityObra() || 0;
    const waste = this.catalogType() === 'materials' ? (this.wastePct() || 0) / 100 : 0;
    return qty * (1 + waste);
  });

  readonly livePurchaseQuantity = computed(() => {
    if (this.catalogType() === 'labor') {
      return this.quantityObra() || 0;
    }
    if (this.isGlobal()) {
      return this.quantityPurchase() || 0;
    }
    const item = this.selectedMaterial();
    if (!item) return 0;
    const factor = Number(item.conversion_factor) || 1;
    const net = this.liveNetQuantity();
    if (factor <= 0) return 0;
    const raw = net / factor;
    return this.applyCeil() ? Math.ceil(raw) : Number(raw.toFixed(4));
  });

  readonly liveEstimatedCost = computed(() => {
    const qty = this.livePurchaseQuantity();
    const override = this.priceOverride();
    if (this.catalogType() === 'materials') {
      const item = this.selectedMaterial();
      const price =
        override !== null && override !== undefined
          ? Number(override)
          : Number(item?.price_per_purchase_unit) || 0;
      return qty * price;
    } else {
      const item = this.selectedLabor();
      const price =
        override !== null && override !== undefined
          ? Number(override)
          : Number(item?.suggested_cost) || 0;
      return qty * price;
    }
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (this.supplierService.suppliers().length === 0) {
          this.supplierService.loadSuppliers().subscribe();
        }
        untracked(() => {
          this.searchTerm.set('');
          this.subcatFilter.set(this.presetSubcategoryId() || null);
          this.supplierFilter.set(null);
          this.stageId.set(this.presetStageId() || null);
          this.isGlobal.set(this.presetIsGlobal());
          this.applyCeil.set(true);
          this.quantityObra.set(null);
          this.quantityPurchase.set(null);
          this.contractorName.set('');
          this.detail.set('');
          this.syncSelected();
        });
      }
    });
  }

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
    this.syncSelected();
  }

  onSubcategorySelect(subcatId: number | null): void {
    this.subcatFilter.set(subcatId);
    this.syncSelected();
  }

  onSupplierSelect(supId: number | null): void {
    this.supplierFilter.set(supId);
    this.syncSelected();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.subcatFilter.set(null);
    this.supplierFilter.set(null);
    this.syncSelected();
  }

  private syncSelected(): void {
    if (this.catalogType() === 'materials') {
      const filtered = this.filteredMaterialItems();
      const current = this.selectedMaterial();
      if (!current || !filtered.some((i) => i.id === current.id)) {
        this.selectMaterial(filtered.length > 0 ? filtered[0] : null);
      }
    } else {
      const filtered = this.filteredLaborItems();
      const current = this.selectedLabor();
      if (!current || !filtered.some((i) => i.id === current.id)) {
        this.selectLabor(filtered.length > 0 ? filtered[0] : null);
      }
    }
  }

  onItemIdChange(id: number | null): void {
    if (this.catalogType() === 'materials') {
      const item = this.materialCatalogService.items().find((i) => i.id === id) ?? null;
      this.selectMaterial(item);
    } else {
      const item = this.laborCatalogService.items().find((i) => i.id === id) ?? null;
      this.selectLabor(item);
    }
  }

  private selectMaterial(item: MaterialCatalogItem | null): void {
    this.selectedMaterial.set(item);
    this.selectedLabor.set(null);
    this.selectedItemId.set(item?.id ?? null);
    if (item) {
      const waste = Number(item.waste_pct) || 0;
      this.wastePct.set(waste * 100);
      this.priceOverride.set(
        item.price_per_purchase_unit !== null ? Number(item.price_per_purchase_unit) : null
      );
    }
  }

  private selectLabor(item: LaborCatalogItem | null): void {
    this.selectedLabor.set(item);
    this.selectedMaterial.set(null);
    this.selectedItemId.set(item?.id ?? null);
    if (item) {
      this.priceOverride.set(
        item.suggested_cost !== null ? Number(item.suggested_cost) : null
      );
      this.contractorName.set(item.contractor_type || item.supplier_name || '');
    }
  }

  canSubmit(): boolean {
    const id = this.selectedItemId();
    if (!id || !this.projectId()) return false;
    if (this.catalogType() === 'materials' && this.isGlobal()) {
      return Number(this.quantityPurchase()) > 0;
    }
    return Number(this.quantityObra()) > 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const itemId = this.selectedItemId()!;
    const pId = this.projectId();

    const payload: FromCatalogUnifiedPayload = {
      project: pId,
      catalog_type: this.catalogType(),
      catalog_id: itemId,
      stage: this.stageId(),
      subcategory: this.presetSubcategoryId() || undefined,
      is_global: this.catalogType() === 'materials' ? this.isGlobal() : false,
      apply_ceil: this.catalogType() === 'materials' ? this.applyCeil() : false,
      quantity_obra:
        this.catalogType() === 'materials' && this.isGlobal() ? null : this.quantityObra(),
      quantity_purchase:
        this.catalogType() === 'materials' && this.isGlobal() ? this.quantityPurchase() : null,
      waste_pct: this.catalogType() === 'materials' ? (this.wastePct() || 0) / 100 : 0,
      price_override: this.priceOverride(),
      contractor_name: this.catalogType() === 'labor' ? this.contractorName().trim() : '',
      detail: this.detail().trim(),
    };

    this.isProcessing.set(true);
    this.budgetService.createFromCatalog(payload).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.isProcessing.set(false);
      },
    });
  }

  handleClose(): void {
    this.close.emit();
  }
}
