import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetItem } from '../../../../../core/models/budget-item.model';
import { UnifiedBudgetService } from '../../../../../core/services/unified-budget.service';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { ConstructionStageService } from '../../../../../core/services/construction-stage.service';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

export interface EditBudgetItemFormModel {
  subcategory_id: number | null;
  stage_id: number | null;
  apply_ceil: boolean;
  quantity_obra: number | null;
  quantity_purchase: number | null;
  unit_price: number | null;
  waste_pct: number;
  contractor_name: string;
  percentage_applied_pct: number | null;
  target_base_cost: number | null;
  detail: string;
}

@Component({
  selector: 'app-edit-budget-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent, InfoTooltipComponent],
  templateUrl: './edit-budget-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBudgetItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly item = input<BudgetItem | null>(null);
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly budgetService = inject(UnifiedBudgetService);
  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly stageService = inject(ConstructionStageService);

  readonly form = signal<EditBudgetItemFormModel>({
    subcategory_id: null,
    stage_id: null,
    apply_ceil: true,
    quantity_obra: null,
    quantity_purchase: null,
    unit_price: null,
    waste_pct: 0,
    contractor_name: '',
    percentage_applied_pct: null,
    target_base_cost: null,
    detail: '',
  });

  readonly isProcessing = signal<boolean>(false);

  readonly availableSubcategories = computed(() => {
    const catType = this.item()?.category_type || 'materials';
    return this.subcategoryService.getSubcategoriesForCategoryType(catType);
  });

  readonly subcategoryOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.availableSubcategories().map((s) => ({
      value: s.id,
      label: s.name,
    }))
  );

  readonly stageOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Sin etapa específica', value: null },
    ...this.stageService.stages().map((st) => ({
      value: st.id,
      label: st.name,
    })),
  ]);

  readonly isParametricItem = computed(() => {
    const cur = this.item();
    if (!cur) return false;
    return (
      (cur.category_type === 'operating' || cur.category_type === 'administrative') &&
      Number(cur.percentage_applied) > 0 &&
      Number(cur.target_base_cost) > 0
    );
  });

  updateField<K extends keyof EditBudgetItemFormModel>(field: K, value: EditBudgetItemFormModel[K]): void {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  constructor() {
    effect(() => {
      const current = this.item();
      if (this.isOpen() && current) {
        if (this.subcategoryService.subcategories().length === 0) {
          this.subcategoryService.loadSubcategories().subscribe();
        }
        untracked(() => {
          this.form.set({
            subcategory_id: current.subcategory ?? current.subcategory_id ?? null,
            stage_id: current.stage ?? current.stage_id ?? null,
            apply_ceil: current.apply_ceil ?? true,
            quantity_obra: current.quantity_obra !== null ? Number(current.quantity_obra) : null,
            quantity_purchase: current.quantity_purchase !== null ? Number(current.quantity_purchase) : null,
            unit_price: current.unit_price !== null ? Number(current.unit_price) : 0,
            waste_pct: (Number(current.waste_pct) || 0) * 100,
            contractor_name: current.contractor_name || '',
            percentage_applied_pct:
              current.percentage_applied !== null ? Number(current.percentage_applied) * 100 : null,
            target_base_cost:
              current.target_base_cost !== null ? Number(current.target_base_cost) : null,
            detail: current.detail || '',
          });
        });
      }
    });
  }

  submit(): void {
    const cur = this.item();
    const f = this.form();
    if (!cur) return;

    const patchData: Partial<BudgetItem> = {
      detail: f.detail.trim(),
      subcategory: f.subcategory_id,
      stage: f.stage_id,
      unit_price: f.unit_price !== null ? Number(f.unit_price) : 0,
    };

    if (cur.category_type === 'materials') {
      patchData.apply_ceil = f.apply_ceil;
      if (!cur.is_global) {
        patchData.quantity_obra = f.quantity_obra !== null ? Number(f.quantity_obra) : null;
        patchData.waste_pct = Number(((f.waste_pct || 0) / 100).toFixed(4));
      } else {
        patchData.quantity_purchase = f.quantity_purchase !== null ? Number(f.quantity_purchase) : 1;
      }
    } else if (cur.category_type === 'labor') {
      patchData.quantity_obra = f.quantity_obra !== null ? Number(f.quantity_obra) : 1;
      patchData.contractor_name = f.contractor_name.trim();
    } else {
      if (this.isParametricItem()) {
        patchData.percentage_applied =
          f.percentage_applied_pct !== null
            ? Number((f.percentage_applied_pct / 100).toFixed(4))
            : null;
        patchData.target_base_cost =
          f.target_base_cost !== null ? Number(f.target_base_cost) : null;
      } else {
        patchData.quantity_purchase = f.quantity_purchase !== null ? Number(f.quantity_purchase) : 1;
      }
    }

    this.isProcessing.set(true);
    this.budgetService.updateItem(cur.id, patchData).subscribe({
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
