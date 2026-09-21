import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialCatalogService } from '../../../../../core/services/material-catalog.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { MaterialBudgetService } from '../../../../../core/services/material-budget.service';
import { MaterialCatalogItem } from '../../../../../core/models/material-catalog.model';
import { FromCatalogGlobalPayload } from '../../../../../core/models/material-budget.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-global-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './add-global-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddGlobalItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly subcategoryService = inject(SubcategoryService);
  private readonly budgetService = inject(MaterialBudgetService);

  readonly searchTerm = signal<string>('');
  readonly subcatFilter = signal<number | null>(null);
  readonly selectedItemId = signal<number | null>(null);
  readonly selectedItem = signal<MaterialCatalogItem | null>(null);
  readonly quantityPurchase = signal<number | null>(1);
  readonly price = signal<number | null>(null);
  readonly detail = signal<string>('');
  readonly isProcessing = signal<boolean>(false);

  readonly subcatFilterOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Todas las subcategorías', value: null },
    ...this.subcategoryService.subcategories().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly catalogItemOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.filteredCatalogItems().map((item) => ({
      label: item.name,
      value: item.id,
      subtitle: `${item.subcategory_detail?.name || 'Subcat'} — ${item.unit_purchase_detail?.abbreviation || 'u'} — Ref: $${item.price_per_purchase_unit || 0}`,
    }))
  );

  readonly filteredCatalogItems = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const subcatId = this.subcatFilter();
    let list = this.catalogService.items();

    if (subcatId !== null && subcatId !== undefined && subcatId !== 0) {
      list = list.filter((i) => i.subcategory === Number(subcatId));
    }

    if (search) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          (i.description && i.description.toLowerCase().includes(search)) ||
          (i.subcategory_detail && i.subcategory_detail.name.toLowerCase().includes(search))
      );
    }

    return list;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        untracked(() => {
          this.searchTerm.set('');
          this.subcatFilter.set(null);
          this.quantityPurchase.set(1);
          this.detail.set('');
          const filtered = this.filteredCatalogItems();
          const initial = filtered.length > 0 ? filtered[0] : null;
          this.onItemChange(initial);
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

  clearFilters(): void {
    this.searchTerm.set('');
    this.subcatFilter.set(null);
    this.syncSelected();
  }

  private syncSelected(): void {
    const filtered = this.filteredCatalogItems();
    const current = this.selectedItem();
    if (!current || !filtered.some((i) => i.id === current.id)) {
      this.onItemChange(filtered.length > 0 ? filtered[0] : null);
    }
  }

  onItemIdChange(id: number | null): void {
    const item = this.catalogService.items().find((i) => i.id === id) ?? null;
    this.onItemChange(item);
  }

  onItemChange(item: MaterialCatalogItem | null): void {
    this.selectedItem.set(item);
    this.selectedItemId.set(item?.id ?? null);
    if (item) {
      this.price.set(
        item.price_per_purchase_unit ? Number(item.price_per_purchase_unit) : null
      );
    }
  }

  submit(): void {
    const item = this.selectedItem();
    const qtyPurchase = this.quantityPurchase();
    const pId = this.projectId();
    if (!item || !qtyPurchase || !pId) return;

    const payload: FromCatalogGlobalPayload = {
      project: pId,
      catalog_item: item.id,
      quantity_purchase: qtyPurchase,
      price_per_purchase_unit: this.price(),
      detail: this.detail().trim(),
    };

    this.isProcessing.set(true);
    this.budgetService.addFromCatalogGlobal(payload).subscribe({
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
