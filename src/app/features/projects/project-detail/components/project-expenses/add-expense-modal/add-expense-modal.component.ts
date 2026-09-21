import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectExpenseService } from '../../../../../../core/services/project-expense.service';
import { SubcategoryService } from '../../../../../../core/services/subcategory.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import {
  CreateProjectExpenseDto,
  ExpenseCategoryType,
  PaymentStatus,
} from '../../../../../../core/models/project-expense.model';
import { ModalComponent } from '../../../../../../shared/components/modal/modal.component';
import {
  CustomSelectComponent,
  CustomSelectOption,
} from '../../../../../../shared/components/custom-select/custom-select.component';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomSelectComponent],
  templateUrl: './add-expense-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExpenseModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly expenseService = inject(ProjectExpenseService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly toast = inject(ToastService);

  readonly categoryType = signal<ExpenseCategoryType>('materials');
  readonly subcategoryId = signal<number | null>(null);
  readonly itemName = signal<string>('');
  readonly unitName = signal<string>('Pza');
  readonly quantity = signal<number | null>(1);
  readonly unitPrice = signal<number | null>(null);
  readonly totalPrice = signal<number | null>(null);
  readonly paymentStatus = signal<PaymentStatus>('paid');
  readonly expenseDate = signal<string>(new Date().toISOString().substring(0, 10));
  readonly paymentMethod = signal<string>('AL CONTADO');
  readonly supplierName = signal<string>('');
  readonly details = signal<string>('');
  readonly rendicionNumber = signal<string>('');
  readonly receiptNumber = signal<string>('');
  readonly selectedReceiptFile = signal<File | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  readonly categoryOptions: CustomSelectOption<ExpenseCategoryType>[] = [
    { label: 'Materiales (MA)', value: 'materials' },
    { label: 'Mano de Obra (M.O.)', value: 'labor' },
    { label: 'Gastos Operativos (G.O.)', value: 'operating' },
    { label: 'Costos Administrativos (C.A.)', value: 'administrative' },
    { label: 'Otros Gastos', value: 'other' },
  ];

  readonly statusOptions: CustomSelectOption<PaymentStatus>[] = [
    { label: 'Pagado', value: 'paid' },
    { label: 'En proceso', value: 'in_process' },
    { label: 'Por cobrar', value: 'pending' },
  ];

  readonly subcategoryOptions = computed<CustomSelectOption<number | null>[]>(() => {
    const subcats = this.subcategoryService.subcategories();
    const list: CustomSelectOption<number | null>[] = [
      { label: 'General / Sin etapa', value: null },
    ];
    for (const s of subcats) {
      list.push({
        label: s.name,
        subtitle: s.category_name ? `Categoría: ${s.category_name}` : undefined,
        value: s.id,
      });
    }
    return list;
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open) {
        untracked(() => {
          this.resetForm();
        });
      }
    });
  }

  onQuantityOrPriceChange(): void {
    const qty = Number(this.quantity()) || 0;
    const price = Number(this.unitPrice()) || 0;
    if (qty > 0 && price > 0) {
      const calc = Number((qty * price).toFixed(2));
      this.totalPrice.set(calc);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 25 * 1024 * 1024) {
        this.toast.error('Archivo pesado', 'El comprobante no debe superar los 25 MB.');
        return;
      }
      this.selectedReceiptFile.set(file);
    }
  }

  removeReceiptFile(): void {
    this.selectedReceiptFile.set(null);
  }

  resetForm(): void {
    this.categoryType.set('materials');
    this.subcategoryId.set(null);
    this.itemName.set('');
    this.unitName.set('Pza');
    this.quantity.set(1);
    this.unitPrice.set(null);
    this.totalPrice.set(null);
    this.paymentStatus.set('paid');
    this.expenseDate.set(new Date().toISOString().substring(0, 10));
    this.paymentMethod.set('AL CONTADO');
    this.supplierName.set('');
    this.details.set('');
    this.rendicionNumber.set('');
    this.receiptNumber.set('');
    this.selectedReceiptFile.set(null);
    this.isSubmitting.set(false);
  }

  submit(): void {
    const name = this.itemName().trim();
    if (!name) {
      this.toast.error('Nombre requerido', 'Ingresa la descripción del ítem o servicio.');
      return;
    }

    const qty = Number(this.quantity()) || 1;
    const price = Number(this.unitPrice()) || 0;
    const total = this.totalPrice() !== null ? Number(this.totalPrice()) : Number((qty * price).toFixed(2));

    const dto: CreateProjectExpenseDto = {
      project: this.projectId(),
      category_type: this.categoryType(),
      subcategory: this.subcategoryId(),
      item_name: name,
      unit_name: this.unitName().trim() || 'Pza',
      quantity: qty,
      unit_price: price,
      total_price: total,
      payment_status: this.paymentStatus(),
      expense_date: this.expenseDate() || new Date().toISOString().substring(0, 10),
      payment_method: this.paymentMethod().trim() || 'AL CONTADO',
      supplier_name: this.supplierName().trim() || undefined,
      details: this.details().trim() || undefined,
      rendicion_number: this.rendicionNumber().trim() || undefined,
      receipt_number: this.receiptNumber().trim() || undefined,
      receipt_file: this.selectedReceiptFile(),
    };

    this.isSubmitting.set(true);
    this.expenseService.createExpense(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
        this.closeModal();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('Error al guardar', 'Ocurrió un error al registrar el gasto.');
      },
    });
  }

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }
}
