import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubcategoryService } from '../../../../../core/services/subcategory.service';
import { UnitOfMeasureService } from '../../../../../core/services/unit-of-measure.service';
import { PurchaseUnitService } from '../../../../../core/services/purchase-unit.service';
import { ConstructionStageService } from '../../../../../core/services/construction-stage.service';
import { SupplierService } from '../../../../../core/services/supplier.service';
import { UnifiedBudgetService } from '../../../../../core/services/unified-budget.service';
import { BudgetCategoryType, BudgetItemCreatePayload } from '../../../../../core/models/budget-item.model';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { CustomSelectComponent, CustomSelectOption } from '../../../../../shared/components/custom-select/custom-select.component';
import { CurrencyClpPipe } from '../../../../../shared/pipes/currency-clp.pipe';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

export interface CustomItemFormModel {
  subcategory: number | null;
  stage: number | null;
  supplier: number | null;
  name: string;
  unit_measure: number | null;
  unit_purchase: number | null;
  unit_price: number | null;
  is_global: boolean;
  apply_ceil: boolean;
  quantity_obra: number | null;
  quantity_purchase: number | null;
  conversion_factor: number | null;
  weight_per_purchase_unit: number | null;
  waste_pct: number;
  contractor_name: string;
  is_parametric: boolean;
  percentage_applied_pct: number | null;
  target_base_cost: number | null;
  detail: string;
}

function createDefaultCustomItemForm(
  subcatId: number | null = null,
  stageId: number | null = null,
  uomId: number | null = null,
  puId: number | null = null
): CustomItemFormModel {
  return {
    subcategory: subcatId,
    stage: stageId,
    supplier: null,
    name: '',
    unit_measure: uomId,
    unit_purchase: puId,
    unit_price: null,
    is_global: false,
    apply_ceil: true,
    quantity_obra: null,
    quantity_purchase: 1,
    conversion_factor: 1,
    weight_per_purchase_unit: null,
    waste_pct: 0,
    contractor_name: '',
    is_parametric: false,
    percentage_applied_pct: null,
    target_base_cost: null,
    detail: '',
  };
}

@Component({
  selector: 'app-add-custom-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent, CurrencyClpPipe, InfoTooltipComponent],
  templateUrl: './add-custom-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddCustomItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();
  readonly categoryType = input<BudgetCategoryType>('materials');
  readonly presetSubcategoryId = input<number | null>(null);
  readonly presetStageId = input<number | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  protected readonly subcategoryService = inject(SubcategoryService);
  protected readonly uomService = inject(UnitOfMeasureService);
  protected readonly puService = inject(PurchaseUnitService);
  protected readonly stageService = inject(ConstructionStageService);
  protected readonly supplierService = inject(SupplierService);
  protected readonly budgetService = inject(UnifiedBudgetService);

  readonly form = signal<CustomItemFormModel>(createDefaultCustomItemForm());
  readonly isProcessing = signal<boolean>(false);

  readonly modalTitle = computed(() => {
    switch (this.categoryType()) {
      case 'materials':
        return 'Crear Material Personalizado';
      case 'labor':
        return 'Crear Ítem de Mano de Obra';
      case 'operating':
        return 'Registrar Gasto Operativo';
      case 'administrative':
        return 'Registrar Gasto Administrativo';
    }
  });

  readonly availableSubcategories = computed(() => {
    return this.subcategoryService.getSubcategoriesForCategoryType(this.categoryType());
  });

  readonly subcategoryOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.availableSubcategories().map((s) => ({
      label: s.name,
      value: s.id,
    }))
  );

  readonly stageOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Sin etapa específica', value: null },
    ...this.stageService.stages().map((st) => ({
      label: st.name,
      value: st.id,
    })),
  ]);

  readonly supplierOptions = computed<CustomSelectOption<number | null>[]>(() => [
    { label: 'Sin proveedor asignado', value: null },
    ...this.supplierService.suppliers().map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ]);

  readonly uomOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.uomService.units().map((u) => ({
      label: `${u.name} (${u.abbreviation})`,
      value: u.id,
    }))
  );

  readonly puOptions = computed<CustomSelectOption<number | null>[]>(() =>
    this.puService.units().map((p) => ({
      label: `${p.name} (${p.abbreviation})`,
      value: p.id,
    }))
  );

  readonly directCostBaseBs = computed(() => {
    const sum = this.budgetService.summary();
    if (!sum) return 0;
    return (Number(sum.materials?.total_cost_bs) || 0) + (Number(sum.labor?.total_cost_bs) || 0);
  });

  updateField<K extends keyof CustomItemFormModel>(field: K, value: CustomItemFormModel[K]): void {
    this.form.update((prev) => ({ ...prev, [field]: value }));
  }

  applySuggestedBase(amount: number): void {
    this.updateField('target_base_cost', Number(amount.toFixed(2)));
  }

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (this.supplierService.suppliers().length === 0) {
          this.supplierService.loadSuppliers().subscribe();
        }
        untracked(() => {
          const subcats = this.subcategoryService.subcategories();
          const uoms = this.uomService.units();
          const pus = this.puService.units();
          const presetSub = this.presetSubcategoryId();
          const presetSt = this.presetStageId();

          this.form.set(
            createDefaultCustomItemForm(
              presetSub || (subcats[0]?.id ?? null),
              presetSt || null,
              uoms[0]?.id ?? null,
              pus[0]?.id ?? null
            )
          );
        });
      }
    });
  }

  canSubmit(): boolean {
    const f = this.form();
    const cat = this.categoryType();
    if (!this.projectId() || !f.name.trim() || !f.subcategory) return false;

    if (cat === 'materials') {
      if (f.unit_price === null || f.unit_price < 0) return false;
      return f.is_global ? Number(f.quantity_purchase) > 0 : Number(f.quantity_obra) > 0;
    }
    if (cat === 'labor') {
      return Number(f.quantity_obra) > 0 && f.unit_price !== null && f.unit_price >= 0;
    }
    if (f.is_parametric) {
      return Number(f.percentage_applied_pct) > 0 && Number(f.target_base_cost) > 0;
    }
    return Number(f.quantity_purchase) > 0 && f.unit_price !== null && f.unit_price >= 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    const f = this.form();
    const pId = this.projectId();
    const cat = this.categoryType();

    const payload: BudgetItemCreatePayload = {
      project: pId,
      category_type: cat,
      subcategory: f.subcategory,
      stage: f.stage,
      supplier: f.supplier,
      name: f.name.trim(),
      detail: f.detail.trim(),
      unit_price: Number(f.unit_price) || 0,
    };

    if (cat === 'materials') {
      payload.unit_measure = f.unit_measure;
      payload.unit_purchase = f.unit_purchase;
      payload.is_global = f.is_global;
      payload.apply_ceil = f.apply_ceil;
      payload.quantity_obra = !f.is_global ? Number(f.quantity_obra) : null;
      payload.quantity_purchase = f.is_global ? Number(f.quantity_purchase) : null;
      payload.conversion_factor = !f.is_global ? Number(f.conversion_factor) || 1 : 1;
      payload.waste_pct = !f.is_global ? (Number(f.waste_pct) || 0) / 100 : 0;
      payload.weight_per_purchase_unit = f.weight_per_purchase_unit;
    } else if (cat === 'labor') {
      payload.unit_measure = f.unit_measure;
      payload.quantity_obra = Number(f.quantity_obra);
      payload.contractor_name = f.contractor_name.trim();
    } else {
      // operating or administrative
      if (f.is_parametric) {
        payload.percentage_applied = Number(((Number(f.percentage_applied_pct) || 0) / 100).toFixed(4));
        payload.target_base_cost = Number(f.target_base_cost);
        payload.unit_price = 0;
      } else {
        payload.unit_measure = f.unit_measure;
        payload.quantity_purchase = Number(f.quantity_purchase) || 1;
        payload.percentage_applied = null;
        payload.target_base_cost = null;
      }
    }

    this.isProcessing.set(true);
    this.budgetService.createItem(payload).subscribe({
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
