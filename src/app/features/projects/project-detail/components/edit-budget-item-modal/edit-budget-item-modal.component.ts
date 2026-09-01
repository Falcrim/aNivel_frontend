import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialBudgetItem } from '../../../../../core/models/material-budget.model';
import { MaterialBudgetService } from '../../../../../core/services/material-budget.service';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';

export interface EditBudgetItemFormModel {
  quantity_obra: number | null;
  quantity_purchase: number | null;
  price_per_purchase_unit: number | null;
  waste_pct: number;
  detail: string;
}

@Component({
  selector: 'app-edit-budget-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './edit-budget-item-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBudgetItemModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly item = input<MaterialBudgetItem | null>(null);
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly budgetService = inject(MaterialBudgetService);

  readonly form = signal<EditBudgetItemFormModel>({
    quantity_obra: null,
    quantity_purchase: null,
    price_per_purchase_unit: null,
    waste_pct: 0,
    detail: '',
  });

  readonly isProcessing = signal<boolean>(false);

  constructor() {
    effect(() => {
      const current = this.item();
      if (this.isOpen() && current) {
        untracked(() => {
          this.form.set({
            quantity_obra: current.quantity_obra !== null ? Number(current.quantity_obra) : null,
            quantity_purchase: Number(current.quantity_purchase) || null,
            price_per_purchase_unit: Number(current.price_per_purchase_unit) || 0,
            waste_pct: (Number(current.waste_pct) || 0) * 100,
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

    const patchData: Partial<MaterialBudgetItem> = {
      detail: f.detail.trim(),
      price_per_purchase_unit: f.price_per_purchase_unit !== null ? f.price_per_purchase_unit.toString() : '0',
    };

    if (!cur.is_global) {
      patchData.quantity_obra = f.quantity_obra !== null ? f.quantity_obra.toString() : null;
      patchData.waste_pct = ((f.waste_pct || 0) / 100).toString();
    } else {
      patchData.quantity_purchase = f.quantity_purchase !== null ? f.quantity_purchase.toString() : '1';
    }

    this.isProcessing.set(true);
    this.budgetService.updateBudgetItem(cur.id, patchData).subscribe({
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
