import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialCatalogService } from '../../../../../core/services/material-catalog.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { MaterialBudgetService } from '../../../../../core/services/material-budget.service';
import { MaterialCatalogItem } from '../../../../../core/models/material-catalog.model';
import { FromCatalogPayload } from '../../../../../core/models/material-budget.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CurrencyClpPipe } from '../../../../../shared/pipes/currency-clp.pipe';

@Component({
  selector: 'app-add-from-catalog-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CurrencyClpPipe],
  templateUrl: './add-from-catalog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFromCatalogModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly presetSubcategoryId = input<number | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly catalogService = inject(MaterialCatalogService);
  protected readonly subcategoryService = inject(SubcategoryService);
  private readonly budgetService = inject(MaterialBudgetService);

  // Filters & State
  readonly searchTerm = signal<string>('');
  readonly subcatFilter = signal<number | null>(null);
  readonly selectedItem = signal<MaterialCatalogItem | null>(null);
  readonly quantityObra = signal<number | null>(null);
  readonly wastePct = signal<number>(0);
  readonly priceOverride = signal<number | null>(null);
  readonly detail = signal<string>('');
  readonly isProcessing = signal<boolean>(false);

  // Filtered catalog items
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

  // Live Formula Computeds
  readonly liveNetQuantity = computed(() => {
    const qty = this.quantityObra() || 0;
    const waste = (this.wastePct() || 0) / 100;
    return qty * (1 + waste);
  });

  readonly livePurchaseQuantity = computed(() => {
    const item = this.selectedItem();
    if (!item) return 0;
    const factor = Number(item.conversion_factor) || 1;
    const net = this.liveNetQuantity();
    if (factor <= 0) return 0;
    return Math.ceil(net / factor);
  });

  readonly liveEstimatedCost = computed(() => {
    const purchaseQty = this.livePurchaseQuantity();
    const item = this.selectedItem();
    const price =
      this.priceOverride() !== null && this.priceOverride() !== undefined
        ? Number(this.priceOverride())
        : Number(item?.price_per_purchase_unit) || 0;
    return purchaseQty * price;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        untracked(() => {
          this.searchTerm.set('');
          this.subcatFilter.set(this.presetSubcategoryId() || null);
          this.quantityObra.set(null);
          this.detail.set('');
          const filtered = this.filteredCatalogItems();
          this.onItemChange(filtered.length > 0 ? filtered[0] : null);
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

  onItemChange(item: MaterialCatalogItem | null): void {
    this.selectedItem.set(item);
    if (item) {
      const waste = Number(item.waste_pct) || 0;
      this.wastePct.set(waste * 100);
      this.priceOverride.set(
        item.price_per_purchase_unit !== null ? Number(item.price_per_purchase_unit) : null
      );
    }
  }

  submit(): void {
    const item = this.selectedItem();
    const qtyObra = this.quantityObra();
    const pId = this.projectId();
    if (!item || !qtyObra || !pId) return;

    const payload: FromCatalogPayload = {
      project: pId,
      catalog_item: item.id,
      quantity_obra: qtyObra,
      detail: this.detail().trim(),
      waste_pct: (this.wastePct() || 0) / 100,
      price_override: this.priceOverride(),
      subcategory: this.presetSubcategoryId() || undefined,
    };

    this.isProcessing.set(true);
    this.budgetService.addFromCatalog(payload).subscribe({
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
