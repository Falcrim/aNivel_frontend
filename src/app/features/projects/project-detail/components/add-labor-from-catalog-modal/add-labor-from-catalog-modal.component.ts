import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LaborCatalogService } from '../../../../../core/services/labor-catalog.service';
import { LaborBudgetService } from '../../../../../core/services/labor-budget.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { FromLaborCatalogDto, LaborBudgetItem } from '../../../../../core/models/labor-budget.model';
import { LaborCatalogItem } from '../../../../../core/models/labor-catalog.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-labor-from-catalog-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './add-labor-from-catalog-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLaborFromCatalogModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly presetSubcategoryId = input<number | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly catalogService = inject(LaborCatalogService);
  protected readonly budgetService = inject(LaborBudgetService);
  protected readonly subcategoryService = inject(SubcategoryService);

  readonly selectedCatalogItemId = signal<number | null>(null);
  readonly quantity = signal<number | null>(null);
  readonly costOverride = signal<number | null>(null);
  readonly contractorName = signal<string>('');
  readonly detail = signal<string>('');
  readonly selectedSubcategoryId = signal<number | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  readonly selectedCatalogItem = computed<LaborCatalogItem | null>(() => {
    const id = this.selectedCatalogItemId();
    if (!id) return null;
    return this.catalogService.items().find((item) => item.id === id) || null;
  });

  readonly catalogOptions = computed<CustomSelectOption[]>(() => {
    const preset = this.presetSubcategoryId();
    let list = this.catalogService.items();
    if (preset) {
      list = list.filter((item) => item.subcategory === preset);
    }
    return list.map((item) => ({
      value: item.id,
      label: `${item.name} (${item.unit_detail?.abbreviation || 'u'} - Bs ${item.suggested_cost})`,
    }));
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.catalogService.loadCatalog().subscribe();
        const preset = this.presetSubcategoryId();
        this.selectedSubcategoryId.set(preset);
        this.selectedCatalogItemId.set(null);
        this.quantity.set(null);
        this.costOverride.set(null);
        this.contractorName.set('');
        this.detail.set('');
      }
    });

    effect(() => {
      const item = this.selectedCatalogItem();
      if (item) {
        this.costOverride.set(Number(item.suggested_cost) || 0);
        this.contractorName.set(item.contractor_type || '');
        this.detail.set(item.detail || '');
        if (!this.selectedSubcategoryId()) {
          this.selectedSubcategoryId.set(item.subcategory);
        }
      }
    });
  }

  onSubmit(): void {
    const catalogId = this.selectedCatalogItemId();
    const qty = this.quantity();
    if (!catalogId || qty === null || qty < 0) return;

    this.isSubmitting.set(true);
    const dto: FromLaborCatalogDto = {
      project: this.projectId(),
      catalog_item: catalogId,
      quantity: qty,
      cost_override: this.costOverride(),
      contractor_name: this.contractorName().trim(),
      detail: this.detail().trim(),
      subcategory: this.selectedSubcategoryId(),
    };

    this.budgetService.createFromCatalog(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
      },
    });
  }
}
