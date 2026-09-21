import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { UnitOfMeasureService } from '../../../../../core/services/unit-of-measure.service';
import { LaborBudgetService } from '../../../../../core/services/labor-budget.service';
import { LaborBudgetItem, UpdateLaborBudgetItemDto } from '../../../../../core/models/labor-budget.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-edit-labor-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './edit-labor-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditLaborItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly item = input<LaborBudgetItem | null>(null);
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly budgetService = inject(LaborBudgetService);

  readonly subcategoryId = signal<number | null>(null);
  readonly name = signal<string>('');
  readonly unitId = signal<number | null>(null);
  readonly quantity = signal<number | null>(null);
  readonly unitCost = signal<number | null>(null);
  readonly contractorName = signal<string>('');
  readonly detail = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  readonly subcategoryOptions = computed<CustomSelectOption[]>(() => {
    return this.subcategoryService
      .subcategories()
      .filter((s) => s.category_name?.toLowerCase().includes('mano') || s.category === 2)
      .map((s) => ({
        value: s.id,
        label: s.name,
      }));
  });

  readonly unitOptions = computed<CustomSelectOption[]>(() => {
    return this.uomService.units().map((u) => ({
      value: u.id,
      label: `${u.name} (${u.abbreviation})`,
    }));
  });

  constructor() {
    effect(() => {
      const it = this.item();
      if (it && this.isOpen()) {
        this.subcategoryId.set(it.subcategory);
        this.name.set(it.name);
        this.unitId.set(it.unit);
        this.quantity.set(Number(it.quantity) || 0);
        this.unitCost.set(Number(it.unit_cost) || 0);
        this.contractorName.set(it.contractor_name || '');
        this.detail.set(it.detail || '');
      }
    });
  }

  onSubmit(): void {
    const it = this.item();
    const subcat = this.subcategoryId();
    const uId = this.unitId();
    const qty = this.quantity();
    const cost = this.unitCost();
    const itemName = this.name().trim();

    if (!it || !subcat || !uId || !itemName || qty === null || qty < 0 || cost === null || cost < 0) {
      return;
    }

    this.isSubmitting.set(true);
    const dto: UpdateLaborBudgetItemDto = {
      project: this.projectId(),
      subcategory: subcat,
      name: itemName,
      unit: uId,
      quantity: qty,
      unit_cost: cost,
      contractor_name: this.contractorName().trim(),
      detail: this.detail().trim(),
    };

    this.budgetService.updateBudgetItem(it.id, dto).subscribe({
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
