import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { UnitOfMeasureService } from '../../../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../../../core/services/purchase-unit.service';
import { MaterialBudgetService } from '../../../../../core/services/material-budget.service';
import { CustomBudgetItemPayload } from '../../../../../core/models/material-budget.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';

export interface CustomItemFormModel {
  subcategory: number;
  name: string;
  unit_measure: number;
  unit_purchase: number;
  price_per_purchase_unit: number | null;
  is_global: boolean;
  quantity_obra: number | null;
  quantity_purchase: number | null;
  conversion_factor: number | null;
  weight_per_purchase_unit: number | null;
  waste_pct: number;
  detail: string;
}

function createDefaultCustomItemForm(subcatId = 0, uomId = 0, puId = 0): CustomItemFormModel {
  return {
    subcategory: subcatId,
    name: '',
    unit_measure: uomId,
    unit_purchase: puId,
    price_per_purchase_unit: null,
    is_global: false,
    quantity_obra: null,
    quantity_purchase: null,
    conversion_factor: 1,
    weight_per_purchase_unit: null,
    waste_pct: 0,
    detail: '',
  };
}

@Component({
  selector: 'app-add-custom-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './add-custom-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCustomItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly presetSubcategoryId = input<number | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);
  private readonly budgetService = inject(MaterialBudgetService);

  readonly form = signal<CustomItemFormModel>(createDefaultCustomItemForm());
  readonly isProcessing = signal<boolean>(false);

  // Computed Options
  readonly subcategoryOptions = () =>
    this.subcategoryService.subcategories().map((s) => ({
      label: s.name,
      value: s.id,
    }));

  readonly uomOptions = () =>
    this.uomService.units().map((u) => ({
      label: `${u.name} (${u.abbreviation})`,
      value: u.id,
    }));

  readonly puOptions = () =>
    this.puService.units().map((p) => ({
      label: `${p.name} (${p.abbreviation})`,
      value: p.id,
    }));

  updateFormSubcat(subcatId: number | null): void {
    if (subcatId !== null) {
      this.form.update((f) => ({ ...f, subcategory: subcatId }));
    }
  }

  updateFormUom(uomId: number | null): void {
    if (uomId !== null) {
      this.form.update((f) => ({ ...f, unit_measure: uomId }));
    }
  }

  updateFormPu(puId: number | null): void {
    if (puId !== null) {
      this.form.update((f) => ({ ...f, unit_purchase: puId }));
    }
  }

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        untracked(() => {
          const subcats = this.subcategoryService.subcategories();
          const uoms = this.uomService.units();
          const pus = this.puService.units();
          const preset = this.presetSubcategoryId();

          this.form.set(
            createDefaultCustomItemForm(
              preset || (subcats[0]?.id ?? 0),
              uoms[0]?.id ?? 0,
              pus[0]?.id ?? 0
            )
          );
        });
      }
    });
  }

  submit(): void {
    const f = this.form();
    const pId = this.projectId();
    const name = f.name.trim();
    const price = Number(f.price_per_purchase_unit);

    if (!pId || !name || !f.subcategory || !f.unit_measure || !f.unit_purchase || f.price_per_purchase_unit === null || isNaN(price)) {
      return;
    }

    const payload: CustomBudgetItemPayload = {
      project: pId,
      subcategory: Number(f.subcategory),
      name,
      unit_measure: Number(f.unit_measure),
      unit_purchase: Number(f.unit_purchase),
      price_per_purchase_unit: price,
      is_global: f.is_global,
      quantity_obra: !f.is_global ? f.quantity_obra : null,
      quantity_purchase: f.is_global ? f.quantity_purchase : undefined,
      conversion_factor: !f.is_global ? f.conversion_factor : null,
      weight_per_purchase_unit: f.weight_per_purchase_unit,
      waste_pct: (f.waste_pct || 0) / 100,
      detail: f.detail.trim(),
    };

    this.isProcessing.set(true);
    this.budgetService.addCustomItem(payload).subscribe({
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
